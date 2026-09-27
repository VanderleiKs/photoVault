mod app;
mod catalog;
mod commands;
mod filesystem;
mod metadata;
mod scanner;
mod thumbnails;

use std::fs::OpenOptions;
use std::io::Write;
use tauri::Manager;

fn log_to_file(message: &str) {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let log_path = exe_dir.join("logs").join("photovault.log");
            if let Some(parent) = log_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if let Ok(mut file) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_path)
            {
                let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
                let _ = writeln!(file, "[{}] {}", timestamp, message);
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log_to_file("=== PhotoVault starting ===");

    // Initialize tracing for logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .with_writer(std::io::stderr)
        .init();

    log_to_file("Tracing initialized");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            log_to_file("Setting up app...");

            // Initialize app state as Arc for sharing across spawned tasks
            let app_state = std::sync::Arc::new(app::AppState::new(app.handle().clone())?);
            app.manage(app_state);

            log_to_file("App state initialized");

            // Run migrations
            let db_path = app::get_db_path(app.handle())?;
            log_to_file(&format!("Database path: {}", db_path.display()));
            
            // Ensure data directory exists before opening the database
            if let Some(parent) = db_path.parent() {
                log_to_file(&format!("Creating data directory: {}", parent.display()));
                if let Err(e) = std::fs::create_dir_all(parent) {
                    log_to_file(&format!("Failed to create data directory: {}", e));
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Failed to create data directory: {}", e),
                    )));
                }
                log_to_file(&format!("Data directory created: {}", parent.display()));
            }

            match tauri::async_runtime::block_on(async {
                catalog::init_database(&db_path).await
            }) {
                Ok(_) => {
                    log_to_file("Database initialized successfully");
                    tracing::info!("PhotoVault initialized successfully");
                    Ok(())
                }
                Err(e) => {
                    log_to_file(&format!("Database initialization failed: {}", e));
                    log_to_file(&format!("Error details: {:?}", e));
                    Err(Box::new(e) as Box<dyn std::error::Error>)
                }
            }
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
