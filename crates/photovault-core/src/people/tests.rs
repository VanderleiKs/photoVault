use super::*;
use crate::catalog::{MediaFilter, MediaQuery, libraries, media};
use crate::db::tests::test_db;

/// Unit vector near `axis` (one axis per person), nudged so faces aren't identical.
fn vector(axis: usize, nudge: usize) -> Vec<f32> {
    let mut v = vec![0f32; DIM];
    v[axis] = 1.0;
    v[64 + nudge % 60] = 0.3;
    crate::ai::clip::normalized(v)
}

fn face(axis: usize, nudge: usize, x: f32) -> FoundFace {
    FoundFace {
        x,
        y: 0.2,
        w: 0.2,
        h: 0.2,
        score: 0.95,
        frontal: 0.9,
        size: 120,
        vector: vector(axis, nudge),
    }
}

struct World {
    pool: SqlitePool,
    lib: String,
    dir: std::path::PathBuf,
}

/// Photos `p00…`: each has the faces (person axis) listed.
async fn world(photos: &[&[usize]]) -> World {
    let (pool, dir) = test_db().await;
    let lib = libraries::create(&pool, "A", dir.to_str().unwrap())
        .await
        .unwrap()
        .id;
    let mut scanned = Vec::new();
    for (i, people) in photos.iter().enumerate() {
        let id = format!("p{i:02}");
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type, file_size,
                                indexed_at, updated_at, thumb_version)
             VALUES (?1, ?2, ?1, ?1, 'jpg', 'image', 1, 'now', 'now', 1)",
        )
        .bind(&id)
        .bind(&lib)
        .execute(&pool)
        .await
        .unwrap();
        scanned.push(Scanned {
            media_id: id,
            thumb_version: 1,
            result: Ok(people
                .iter()
                .enumerate()
                .map(|(k, &axis)| face(axis, i, 0.1 + 0.3 * k as f32))
                .collect()),
        });
    }
    store(&pool, &scanned).await.unwrap();
    World { pool, lib, dir }
}

impl World {
    async fn people(&self) -> Vec<PersonSummary> {
        list(&self.pool, &self.lib, true).await.unwrap()
    }

    async fn photos(&self, filter: MediaFilter) -> Vec<String> {
        let mut ids: Vec<String> = media::list(
            &self.pool,
            &self.lib,
            &MediaQuery {
                filter,
                ..Default::default()
            },
            None,
            100,
        )
        .await
        .unwrap()
        .items
        .into_iter()
        .map(|m| m.id)
        .collect();
        ids.sort();
        ids
    }

    async fn face_of(&self, media: &str) -> FaceInfo {
        faces_of_media(&self.pool, media).await.unwrap().remove(0)
    }
}

impl Drop for World {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.dir);
    }
}

#[tokio::test]
async fn faces_become_suggested_people_that_the_user_names() {
    // Person 0 in 4 photos (one with person 1), person 1 in 3, person 2 only once.
    let w = world(&[&[0], &[0], &[0, 1], &[1], &[0], &[1], &[2]]).await;
    assert_eq!(pending_count(&w.pool).await.unwrap(), 0);
    assert!(is_dirty(&w.pool).await.unwrap());
    rebuild(&w.pool).await.unwrap();
    assert!(!is_dirty(&w.pool).await.unwrap());

    let people = w.people().await;
    assert_eq!(people.len(), 2, "the stranger is not a person");
    assert_eq!(people[0].photo_count, 4);
    assert_eq!(people[1].photo_count, 3);
    assert!(
        people
            .iter()
            .all(|p| p.name.is_none() && p.cover_face_id.is_some())
    );
    let (ana, bruno) = (people[0].id.clone(), people[1].id.clone());

    // Ids survive regrouping.
    mark_dirty(&w.pool).await.unwrap();
    rebuild(&w.pool).await.unwrap();
    let again: Vec<String> = w.people().await.into_iter().map(|p| p.id).collect();
    assert_eq!(again, [ana.clone(), bruno.clone()]);

    // Naming: the person, its photos, and the search.
    assert_eq!(rename(&w.pool, &ana, "  Ana   Souza ").await.unwrap(), ana);
    let named = get(&w.pool, &w.lib, &ana).await.unwrap();
    assert_eq!(named.name.as_deref(), Some("Ana Souza"));
    let with_ana = ["p00", "p01", "p02", "p04"].map(String::from).to_vec();
    let by_person = MediaFilter {
        person_id: Some(ana.clone()),
        ..Default::default()
    };
    assert_eq!(w.photos(by_person).await, with_ana);
    for text in ["ana", "ANA souza", "Âna"] {
        let by_text = MediaFilter {
            text: Some(text.into()),
            ..Default::default()
        };
        assert_eq!(w.photos(by_text).await, with_ana, "{text}");
    }
    let nobody = MediaFilter {
        text: Some("souza ana".into()),
        ..Default::default()
    };
    assert!(w.photos(nobody).await.is_empty());
    assert!(rename(&w.pool, &ana, "   ").await.is_err());

    // Named first, then suggestions; the photo shows who is in it.
    assert_eq!(w.people().await[0].id, ana);
    let in_p02 = faces_of_media(&w.pool, "p02").await.unwrap();
    assert_eq!(in_p02.len(), 2);
    assert_eq!(in_p02[0].person_name.as_deref(), Some("Ana Souza"));
    assert!(in_p02[0].confirmed);
    assert_eq!(in_p02[1].person_id.as_deref(), Some(bruno.as_str()));
    assert!(in_p02[1].person_name.is_none());
}

#[tokio::test]
async fn corrections_stick_across_regrouping() {
    let w = world(&[&[0], &[0], &[0], &[0], &[1], &[1], &[1]]).await;
    rebuild(&w.pool).await.unwrap();
    let people = w.people().await;
    let (ana, bruno) = (people[0].id.clone(), people[1].id.clone());
    rename(&w.pool, &ana, "Ana").await.unwrap();

    // "Not Ana": the face leaves and doesn't come back.
    let wrong = w.face_of("p03").await;
    remove_faces(&w.pool, std::slice::from_ref(&wrong.id))
        .await
        .unwrap();
    rebuild(&w.pool).await.unwrap();
    assert!(w.face_of("p03").await.person_id.is_none());
    assert_eq!(get(&w.pool, &w.lib, &ana).await.unwrap().photo_count, 3);

    // "This is Carla": a new named person; later photos of her join her.
    let carla = name_face(&w.pool, &wrong.id, "Carla").await.unwrap();
    rebuild(&w.pool).await.unwrap();
    assert_eq!(
        w.face_of("p03").await.person_id.as_deref(),
        Some(carla.as_str())
    );
    // …and naming the same name again reuses her (accents and case ignored).
    assert_eq!(name_face(&w.pool, &wrong.id, "carla").await.unwrap(), carla);

    // Same person: Bruno's faces go to Ana, and Bruno is gone.
    merge(&w.pool, &ana, std::slice::from_ref(&bruno))
        .await
        .unwrap();
    assert!(matches!(
        get(&w.pool, &w.lib, &bruno).await,
        Err(Error::PersonNotFound)
    ));
    assert_eq!(get(&w.pool, &w.lib, &ana).await.unwrap().photo_count, 6);
    rebuild(&w.pool).await.unwrap();
    assert_eq!(get(&w.pool, &w.lib, &ana).await.unwrap().photo_count, 6);

    // Renaming to an existing name merges too.
    let people = w.people().await;
    let carla_now = people
        .iter()
        .find(|p| p.name.as_deref() == Some("Carla"))
        .unwrap();
    assert_eq!(rename(&w.pool, &carla_now.id, "ANA").await.unwrap(), ana);
    assert_eq!(w.people().await.len(), 1);

    // Hidden: out of the list and of the search, still grouped.
    set_hidden(&w.pool, &ana, true).await.unwrap();
    assert!(list(&w.pool, &w.lib, false).await.unwrap().is_empty());
    assert!(search(&w.pool, "ana").await.unwrap().is_empty());
    rebuild(&w.pool).await.unwrap();
    assert_eq!(list(&w.pool, &w.lib, true).await.unwrap().len(), 1);
}

#[tokio::test]
async fn a_new_preview_keeps_the_names_and_removing_the_models_forgets_everything() {
    let w = world(&[&[0], &[0], &[0]]).await;
    rebuild(&w.pool).await.unwrap();
    let ana = w.people().await[0].id.clone();
    rename(&w.pool, &ana, "Ana").await.unwrap();

    // The file was edited: new preview, same face (slightly moved) → still Ana.
    let mut moved = face(0, 9, 0.12);
    moved.y = 0.21;
    store(
        &w.pool,
        &[Scanned {
            media_id: "p00".into(),
            thumb_version: 2,
            result: Ok(vec![moved]),
        }],
    )
    .await
    .unwrap();
    let f = w.face_of("p00").await;
    assert_eq!(f.person_id.as_deref(), Some(ana.as_str()));
    assert!(f.confirmed);

    // A preview that can't be read is recorded (not retried) and has no faces.
    store(
        &w.pool,
        &[Scanned {
            media_id: "p01".into(),
            thumb_version: 1,
            result: Err("Prévia ilegível".into()),
        }],
    )
    .await
    .unwrap();
    assert!(faces_of_media(&w.pool, "p01").await.unwrap().is_empty());
    assert_eq!(
        pending(&w.pool, 10).await.unwrap(),
        [("p00".to_string(), 1)]
    );

    delete_all(&w.pool).await.unwrap();
    assert!(w.people().await.is_empty());
    assert_eq!(pending_count(&w.pool).await.unwrap(), 3);
}

#[test]
fn tiny_detections_are_dropped() {
    let d = Detection {
        x: 10.0,
        y: 10.0,
        w: 20.0,
        h: 22.0,
        landmarks: [[0.0; 2]; 5],
        score: 0.9,
    };
    assert!(FoundFace::new(&d, vec![0.0; DIM], 1024, 768).is_none());
    let d = Detection {
        w: 100.0,
        h: 120.0,
        ..d
    };
    let f = FoundFace::new(&d, vec![0.0; DIM], 1000, 500).unwrap();
    assert_eq!(f.size, 100);
    assert!((f.w - 0.1).abs() < 1e-6 && (f.h - 0.24).abs() < 1e-6);
}
