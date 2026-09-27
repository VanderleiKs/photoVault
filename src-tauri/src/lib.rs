mod app;
mod catalog;
mod commands;
mod filesystem;
mod metadata;
mod scanner;
mod thumbnails;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing for logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .with_writer(std::io::stderr)
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize app state as Arc for sharing across spawned tasks
            let app_state = std::sync::Arc::new(app::AppState::new(app.handle().clone())?);
            app.manage(app_state);

            // Run migrations
            let db_path = app::get_db_path(app.handle())?;
            tauri::async_runtime::block_on(async {
                catalog::init_database(&db_path).await
            })?;

            tracing::info!("PhotoVault initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_library,
            commands::list_libraries,
            commands::get_library_stats,
            commands::scan_library,
            commands::cancel_scan,
            commands::get_photos,
            commands::get_photo,
            commands::get_thumbnail,
            commands::delete_library,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
