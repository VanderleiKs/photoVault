use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::catalog::organize::{
    self, GroupKind, GroupPage, MediaAnalysis, OrganizeCounts, TagCount,
};

/// Counters of the "Organizar" menu.
#[tauri::command]
#[specta::specta]
pub async fn get_organize_counts(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<OrganizeCounts> {
    Ok(organize::counts(&state.pool, &library_id).await?)
}

/// Duplicate/similar groups or bursts, best candidate first in each.
#[tauri::command]
#[specta::specta]
pub async fn list_groups(
    library_id: String,
    kind: GroupKind,
    offset: u32,
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<GroupPage> {
    Ok(organize::groups(&state.pool, &library_id, kind, offset, limit).await?)
}

/// Quality, labels and groups of one item (info panel / viewer).
#[tauri::command]
#[specta::specta]
pub async fn get_media_analysis(
    media_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<MediaAnalysis> {
    Ok(organize::media_analysis(&state.pool, &media_id).await?)
}

/// Returns the normalized tag.
#[tauri::command]
#[specta::specta]
pub async fn add_tag(
    media_ids: Vec<String>,
    tag: String,
    state: AppStateRef<'_>,
) -> ApiResult<String> {
    Ok(organize::add_tag(&state.pool, &media_ids, &tag).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn remove_tag(
    media_ids: Vec<String>,
    tag: String,
    state: AppStateRef<'_>,
) -> ApiResult<()> {
    Ok(organize::remove_tag(&state.pool, &media_ids, &tag).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn list_tags(library_id: String, state: AppStateRef<'_>) -> ApiResult<Vec<TagCount>> {
    Ok(organize::tags(&state.pool, &library_id).await?)
}
