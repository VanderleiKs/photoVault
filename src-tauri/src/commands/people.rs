use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::people::{self, FaceInfo, PersonSummary};
use serde::Serialize;
use specta::Type;

/// Pessoas: named people, then suggestions (hidden ones only when asked).
#[tauri::command]
#[specta::specta]
pub async fn list_people(
    state: AppStateRef<'_>,
    library_id: String,
    include_hidden: bool,
) -> ApiResult<Vec<PersonSummary>> {
    Ok(people::list(&state.pool, &library_id, include_hidden).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_person(
    state: AppStateRef<'_>,
    library_id: String,
    person_id: String,
) -> ApiResult<PersonSummary> {
    Ok(people::get(&state.pool, &library_id, &person_id).await?)
}

/// Faces in a photo (info panel, viewer).
#[tauri::command]
#[specta::specta]
pub async fn get_media_faces(state: AppStateRef<'_>, media_id: String) -> ApiResult<Vec<FaceInfo>> {
    Ok(people::faces_of_media(&state.pool, &media_id).await?)
}

/// Faces of a person, to review ("not this person").
#[tauri::command]
#[specta::specta]
pub async fn get_person_faces(
    state: AppStateRef<'_>,
    library_id: String,
    person_id: String,
    limit: u32,
) -> ApiResult<Vec<FaceInfo>> {
    Ok(people::faces_of_person(&state.pool, &library_id, &person_id, limit.min(2000)).await?)
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PersonName {
    pub id: String,
    pub name: String,
}

/// Named people, for suggesting while typing a name.
#[tauri::command]
#[specta::specta]
pub async fn list_person_names(state: AppStateRef<'_>) -> ApiResult<Vec<PersonName>> {
    Ok(people::names(&state.pool)
        .await?
        .into_iter()
        .map(|(id, name)| PersonName { id, name })
        .collect())
}

/// Returns the id that remains (another person with that name absorbs this one).
#[tauri::command]
#[specta::specta]
pub async fn rename_person(
    state: AppStateRef<'_>,
    person_id: String,
    name: String,
) -> ApiResult<String> {
    let id = people::rename(&state.pool, &person_id, &name).await?;
    state.jobs.wake();
    Ok(id)
}

#[tauri::command]
#[specta::specta]
pub async fn merge_people(
    state: AppStateRef<'_>,
    target_id: String,
    source_ids: Vec<String>,
) -> ApiResult<()> {
    people::merge(&state.pool, &target_id, &source_ids).await?;
    state.jobs.wake();
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn set_person_hidden(
    state: AppStateRef<'_>,
    person_id: String,
    hidden: bool,
) -> ApiResult<()> {
    people::set_hidden(&state.pool, &person_id, hidden).await?;
    state.jobs.wake();
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn set_person_cover(
    state: AppStateRef<'_>,
    person_id: String,
    face_id: String,
) -> ApiResult<()> {
    Ok(people::set_cover(&state.pool, &person_id, &face_id).await?)
}

/// "Not this person".
#[tauri::command]
#[specta::specta]
pub async fn remove_person_faces(state: AppStateRef<'_>, face_ids: Vec<String>) -> ApiResult<()> {
    people::remove_faces(&state.pool, &face_ids).await?;
    state.jobs.wake();
    Ok(())
}

/// "This is Ana": returns the person's id.
#[tauri::command]
#[specta::specta]
pub async fn name_face(state: AppStateRef<'_>, face_id: String, name: String) -> ApiResult<String> {
    let id = people::name_face(&state.pool, &face_id, &name).await?;
    state.jobs.wake();
    Ok(id)
}
