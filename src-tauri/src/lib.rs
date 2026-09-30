mod commands;
mod error;
mod events;
mod protocol;
mod state;

use photovault_core::db;
use photovault_core::jobs::JobRunner;
use photovault_core::paths::AppPaths;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_specta::{collect_commands, collect_events};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, fmt};

/// Commands and events exposed to the frontend (single source for the TS bindings).
pub fn specta_builder() -> tauri_specta::Builder<tauri::Wry> {
    use commands::{
        ai, albums, arrange, events as event_commands, jobs, libraries, media, organize, people,
        review, scan, system,
    };
    tauri_specta::Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            system::get_app_info,
            system::get_settings,
            system::save_settings,
            system::get_volume_info,
            system::pick_folder,
            system::open_logs_dir,
            libraries::list_libraries,
            libraries::create_library,
            libraries::rename_library,
            libraries::relocate_library,
            libraries::delete_library,
            libraries::get_library_stats,
            scan::scan_library,
            scan::cancel_scan,
            scan::get_scanning_library,
            media::list_media,
            media::list_pending_video_frames,
            media::save_video_frame,
            media::fail_video_frame,
            media::count_media,
            media::get_media,
            media::get_media_context,
            media::set_favorite,
            media::get_media_albums,
            media::get_overview,
            media::get_timeline,
            media::list_places,
            media::list_cameras,
            albums::list_albums,
            albums::list_album_suggestions,
            albums::get_album,
            albums::create_album,
            albums::rename_album,
            albums::update_album_rule,
            albums::delete_album,
            albums::add_to_album,
            albums::remove_from_album,
            albums::set_album_cover,
            organize::get_organize_counts,
            organize::list_groups,
            organize::get_media_analysis,
            organize::add_tag,
            organize::remove_tag,
            organize::list_tags,
            event_commands::list_events,
            event_commands::get_event,
            event_commands::get_event_days,
            event_commands::get_event_highlights,
            event_commands::accept_event,
            event_commands::ignore_event,
            event_commands::restore_event,
            event_commands::update_event,
            event_commands::remove_from_event,
            event_commands::merge_events,
            ai::get_ai_status,
            ai::download_ai_models,
            ai::cancel_ai_download,
            ai::remove_ai_models,
            people::list_people,
            people::get_person,
            people::get_media_faces,
            people::get_person_faces,
            people::list_person_names,
            people::rename_person,
            people::merge_people,
            people::set_person_hidden,
            people::set_person_cover,
            people::remove_person_faces,
            people::name_face,
            arrange::preview_arrange,
            arrange::create_arrange,
            arrange::discard_arrange,
            arrange::start_arrange,
            arrange::undo_arrange,
            arrange::pause_arrange,
            arrange::get_arrange_batch,
            arrange::list_arrange_batches,
            arrange::list_arrange_items,
            event_commands::reclassify_events,
            event_commands::get_detected_homes,
            event_commands::search_home_places,
            review::get_review_summary,
            review::get_media_review,
            review::get_pending_reasons,
            review::decide_review,
            review::list_review_history,
            review::list_examples,
            review::add_examples,
            review::add_example_from_file,
            review::set_example_intent,
            review::remove_example,
            review::trash_media,
            review::restore_media,
            review::purge_media,
            review::empty_trash,
            review::get_trash_summary,
            review::get_trash_entry,
            jobs::get_job_progress,
            jobs::pause_jobs,
            jobs::resume_jobs,
            jobs::list_job_failures,
            jobs::retry_failed_jobs,
        ])
        .events(collect_events![
            events::ScanProgressEvent,
            events::ScanCompleteEvent,
            events::ScanErrorEvent,
            events::JobProgressEvent,
            events::MediaUpdatedEvent,
            events::AnalysisUpdatedEvent,
            events::PeopleUpdatedEvent,
        ])
}

/// Where the generated TypeScript bindings live (relative to `src-tauri/`).
pub const BINDINGS_PATH: &str = "../src/app/core/ipc/bindings.ts";

pub fn export_bindings(builder: &tauri_specta::Builder<tauri::Wry>, path: &str) {
    builder
        .export(
            specta_typescript::Typescript::default()
                .header("// Generated by tauri-specta. Do not edit: run `cargo test -p photovault export_bindings`.\n"),
            path,
        )
        .expect("failed to export TypeScript bindings");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let paths = match AppPaths::init() {
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
        // nom-exif logs every tag at INFO and "GPS not found" at WARN for each file.
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,nom_exif=error")),
        )
        .with(fmt::layer().with_writer(std::io::stderr))
        .with(fmt::layer().with_ansi(false).with_writer(file_writer))
        .init();

    tracing::info!(
        "=== PhotoVault {} starting ({:?}, base dir: {}) ===",
        env!("CARGO_PKG_VERSION"),
        paths.mode,
        paths.base_dir.display()
    );

    let builder = specta_builder();
    #[cfg(debug_assertions)]
    export_bindings(&builder, BINDINGS_PATH);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .register_asynchronous_uri_scheme_protocol(protocol::SCHEME, |ctx, request, responder| {
            let app = ctx.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                responder.respond(protocol::handle(&app, &request).await);
            });
        })
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);

            let database =
                tauri::async_runtime::block_on(db::open(&paths.db_path, &paths.thumbnails_dir))
                    .inspect_err(|e| tracing::error!("Database initialization failed: {e}"))?;

            let jobs = tauri::async_runtime::block_on(JobRunner::new(
                database.pool.clone(),
                paths.thumbnails_dir.clone(),
                Arc::new(events::TauriJobObserver(app.handle().clone())),
            ))?;
            tauri::async_runtime::spawn(Arc::clone(&jobs).run());
            // Linux dev builds: the ONNX Runtime fetched by `npm run ort:fetch` (the AppImage
            // carries it in usr/lib, which the core finds next to the executable).
            if cfg!(debug_assertions) {
                photovault_core::ai::add_runtime_path(
                    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                        .join("lib")
                        .join(photovault_core::ai::RUNTIME_LIB),
                );
            }
            // Local AI, if downloaded and enabled: loaded in the background (~1 s).
            tauri::async_runtime::spawn({
                let (pool, models, jobs) = (
                    database.pool.clone(),
                    paths.models_dir.clone(),
                    Arc::clone(&jobs),
                );
                async move {
                    if matches!(photovault_core::ai::sync(&pool, &models).await, Ok(true)) {
                        jobs.wake();
                    }
                }
            });
            // Settle trash operations and file moves cut short last time, then the optional cleanup.
            tauri::async_runtime::spawn({
                let (pool, thumbnails) = (database.pool.clone(), paths.thumbnails_dir.clone());
                async move {
                    match photovault_core::trash::recover(&pool).await {
                        Ok(0) => {}
                        Ok(n) => tracing::info!("Settled {n} interrupted trash operations"),
                        Err(e) => tracing::warn!("Trash recovery failed: {e}"),
                    }
                    match photovault_core::arrange::run::recover(&pool).await {
                        Ok(0) => {}
                        Ok(n) => tracing::info!("Settled {n} interrupted file moves"),
                        Err(e) => tracing::warn!("Move recovery failed: {e}"),
                    }
                    let days = photovault_core::catalog::settings::get(&pool)
                        .await
                        .map(|s| s.review.auto_purge_days)
                        .unwrap_or(0);
                    match photovault_core::trash::auto_purge(&pool, &thumbnails, days).await {
                        Ok(0) => {}
                        Ok(n) => {
                            tracing::info!("Trash cleanup deleted {n} items older than {days} days")
                        }
                        Err(e) => tracing::warn!("Trash cleanup failed: {e}"),
                    }
                }
            });

            app.manage(Arc::new(state::AppState {
                pool: database.pool,
                paths: paths.clone(),
                scan: Default::default(),
                jobs,
                scanning_library: Mutex::new(None),
                archived_legacy_catalog: database.archived_legacy_catalog,
            }));

            // The window is created here (not from tauri.conf) so the WebView profile
            // lives in the portable folder instead of %LOCALAPPDATA% / ~/.local/share.
            let config = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .ok_or("missing window config")?;
            tauri::WebviewWindowBuilder::from_config(app.handle(), &config)?
                .data_directory(paths.webview_dir.clone())
                .build()?;

            tracing::info!("PhotoVault initialized");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    /// Regenerates the TS bindings; CI fails if the committed file is stale.
    #[test]
    fn export_bindings() {
        super::export_bindings(&super::specta_builder(), super::BINDINGS_PATH);
    }
}
