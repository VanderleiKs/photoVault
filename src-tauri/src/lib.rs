mod app;
mod catalog;
mod commands;
mod metadata;
mod protocol;
mod scanner;
mod thumbnails;

use std::sync::Arc;
use tauri::Manager;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, fmt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let paths = match app::AppPaths::init() {
        Ok(paths) => paths,
        Err(e) => {
            eprintln!("PhotoVault: {e}");
            std::process::exit(1);
        }
    };

    // Logs go to <base>/logs/photovault.log.YYYY-MM-DD (and stderr in dev).
    // The guard must live until the app exits to flush the file writer.
    let file_appender = tracing_appender::rolling::daily(&paths.logs_dir, "photovault.log");
    let (file_writer, _log_guard) = tracing_appender::non_blocking(file_appender);
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().with_writer(std::io::stderr))
        .with(fmt::layer().with_ansi(false).with_writer(file_writer))
        .init();

    tracing::info!(
        "=== PhotoVault starting (base dir: {}) ===",
        paths.base_dir.display()
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .register_asynchronous_uri_scheme_protocol(protocol::SCHEME, |ctx, request, responder| {
            let app = ctx.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                responder.respond(protocol::handle(&app, &request).await);
            });
        })
        .setup(move |app| {
            tracing::info!("Database path: {}", paths.db_path.display());
            let pool = tauri::async_runtime::block_on(catalog::init_database(&paths.db_path))
                .inspect_err(|e| tracing::error!("Database initialization failed: {e:?}"))?;

            app.manage(Arc::new(app::AppState {
                pool,
                paths: paths.clone(),
                scan: Default::default(),
            }));

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
            commands::get_photo_navigation,
            commands::delete_library,
            commands::pick_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
