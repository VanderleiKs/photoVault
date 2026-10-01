//! Exact copies (same bytes, phase 8.1): all of them can go at once, keeping the suggested
//! one of each group, or automatically after each analysis if the user turned it on
//! (`ReviewSettings::auto_trash_exact`, off by default: an exception to R1 the user opts
//! into). Always reversible: they go to the trash like any other photo, after their albums
//! and tags are handed to the photo that stays.

use crate::error::Result;
use crate::trash::{self, TrashResult};
use sqlx::SqlitePool;
use std::path::Path;

/// Copies that may go: in an exact group, not its suggested (best) photo, active, not a
/// favorite (R5), and not one the user said to keep (or to ignore) in Revisão.
/// (copy, photo that stays)
pub async fn removable(pool: &SqlitePool, library_id: &str) -> Result<Vec<(String, String)>> {
    Ok(sqlx::query_as(
        "SELECT s.media_id, g.best_media_id FROM similarity_groups g
         JOIN similarity_members s ON s.group_id = g.id
         JOIN media m ON m.id = s.media_id
         JOIN media b ON b.id = g.best_media_id
         WHERE g.library_id = ?1 AND g.kind = 'exact_duplicate' AND s.media_id != g.best_media_id
           AND m.status = 'active' AND m.is_favorite = 0 AND b.status = 'active'
           AND NOT EXISTS (SELECT 1 FROM review_candidates c WHERE c.media_id = s.media_id
                           AND c.reason = 'EXACT_DUPLICATE' AND c.status IN ('kept', 'ignored'))
         ORDER BY s.media_id",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?)
}

/// The copy's albums and tags now also belong to the photo that stays.
async fn hand_over(pool: &SqlitePool, copy: &str, keeper: &str) -> Result<()> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        "INSERT OR IGNORE INTO album_media (album_id, media_id, position)
         SELECT album_id, ?2, position FROM album_media WHERE media_id = ?1",
    )
    .bind(copy)
    .bind(keeper)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "INSERT OR IGNORE INTO media_labels (media_id, label_id, score, source, active)
         SELECT ?2, ml.label_id, ml.score, ml.source, ml.active FROM media_labels ml
         JOIN labels l ON l.id = ml.label_id WHERE ml.media_id = ?1 AND l.dimension = 'tag'",
    )
    .bind(copy)
    .bind(keeper)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(())
}

/// Send every removable copy to the trash (`use_system_trash`: the user's setting for
/// manual actions; the automatic mode always uses the library trash).
pub async fn trash_all(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    library_id: &str,
    use_system_trash: bool,
) -> Result<TrashResult> {
    let copies = removable(pool, library_id).await?;
    for (copy, keeper) in &copies {
        hand_over(pool, copy, keeper).await?;
    }
    let ids: Vec<String> = copies.into_iter().map(|(c, _)| c).collect();
    let result = trash::send(pool, thumbnails_dir, &ids, use_system_trash).await?;
    if !result.done.is_empty() {
        tracing::info!(
            "Exact copies sent to the trash in library {library_id}: {}",
            result.done.len()
        );
    }
    Ok(result)
}
