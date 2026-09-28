use crate::app::AppState;
use crate::catalog::{self, Library, LibraryStats, Photo, PhotoNavigation};
use crate::scanner;
use std::path::Path;
use std::sync::Arc;
use tauri::{Emitter, State};
use tauri_plugin_dialog::DialogExt;

type AppStateRef<'a> = State<'a, Arc<AppState>>;

fn db_err(e: sqlx::Error) -> String {
    tracing::error!("Database error: {}", e);
    format!("Erro no banco de dados: {e}")
}

#[tauri::command]
pub async fn create_library(
    name: String,
    root_path: String,
    state: AppStateRef<'_>,
) -> Result<Library, String> {
    let name = name.trim();
    let root_path = root_path.trim();
    if name.is_empty() {
        return Err("Informe o nome da biblioteca.".into());
    }
    if !Path::new(root_path).is_dir() {
        return Err(format!(
            "A pasta não existe ou não está acessível: {root_path}"
        ));
    }

    catalog::create_library(&state.pool, name, root_path)
        .await
        .map_err(db_err)
}

#[tauri::command]
pub async fn list_libraries(state: AppStateRef<'_>) -> Result<Vec<Library>, String> {
    catalog::list_libraries(&state.pool).await.map_err(db_err)
}

#[tauri::command]
pub async fn get_library_stats(
    library_id: String,
    state: AppStateRef<'_>,
) -> Result<LibraryStats, String> {
    catalog::get_library_stats(&state.pool, &library_id)
        .await
        .map_err(db_err)
}

/// Start scanning a library in the background.
/// Progress: `scan_progress`; end: `scan_complete` or `scan_error`.
#[tauri::command]
pub async fn scan_library(
    library_id: String,
    app_handle: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> Result<(), String> {
    let library = catalog::get_library(&state.pool, &library_id)
        .await
        .map_err(db_err)?
        .ok_or_else(|| "Biblioteca não encontrada.".to_string())?;

    let guard = state
        .scan
        .try_start()
        .ok_or_else(|| "Já existe um scan em andamento.".to_string())?;
    let state = Arc::clone(state.inner());

    tauri::async_runtime::spawn(async move {
        let _guard = guard;
        if let Err(e) =
            scanner::scan_library(&app_handle, &state, &library.id, &library.root_path).await
        {
            tracing::error!("Scan failed: {}", e);
            let _ = app_handle.emit(
                "scan_error",
                serde_json::json!({ "libraryId": library.id, "error": e }),
            );
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_scan(state: AppStateRef<'_>) -> Result<(), String> {
    state.scan.cancel();
    Ok(())
}

#[tauri::command]
pub async fn get_photos(
    library_id: String,
    page: i64,
    limit: i64,
    state: AppStateRef<'_>,
) -> Result<Vec<Photo>, String> {
    catalog::get_photos(&state.pool, &library_id, page, limit)
        .await
        .map_err(db_err)
}

#[tauri::command]
pub async fn get_photo(photo_id: String, state: AppStateRef<'_>) -> Result<Option<Photo>, String> {
    catalog::get_photo(&state.pool, &photo_id)
        .await
        .map_err(db_err)
}

#[tauri::command]
pub async fn get_photo_navigation(
    photo_id: String,
    state: AppStateRef<'_>,
) -> Result<PhotoNavigation, String> {
    catalog::get_photo_navigation(&state.pool, &photo_id)
        .await
        .map_err(db_err)
}

/// Delete a library from the catalog (does NOT delete photos from disk).
#[tauri::command]
pub async fn delete_library(library_id: String, state: AppStateRef<'_>) -> Result<(), String> {
    catalog::delete_library(&state.pool, &library_id)
        .await
        .map_err(db_err)
}

/// Open the native folder picker and return the selected path.
#[tauri::command]
pub async fn pick_folder(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();

    app_handle.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path.and_then(|p| p.into_path().ok()));
    });

    rx.await
        .map(|path| path.map(|p| p.to_string_lossy().into_owned()))
        .map_err(|e| e.to_string())
}
