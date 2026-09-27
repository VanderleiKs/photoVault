# AGENTS.md

PhotoVault — portable desktop app for organizing photo libraries.  
Stack: Angular 22 + Tauri 2.x (Rust) + SQLite (WAL).

## Commands

```bash
npm install --legacy-peer-deps   # required flag; plain npm install fails
npm run tauri:dev                 # full dev: Angular + Rust backend
npm run tauri:build               # production build
```

- `npm run dev` / `npm run build` run Angular only (no backend).  
- There are **no tests, no linter, no formatter, no CI**. Don't look for them.

## Architecture

Two halves that talk via Tauri IPC:

| Layer | Location | Language |
|-------|----------|----------|
| Frontend | `src/` | Angular 22 (standalone components, signals) |
| Backend | `src-tauri/` | Rust (Tauri 2) |

### Frontend stack
- **CSS**: Bootstrap 5.3 (grid, utilities, components)
- **Component library**: @openng/optimus-ui v2 (PrimeNG-based: Button, Card, InputText, Menu)
- **Icons**: PrimeIcons (`pi pi-*`) — consistent with Optimus UI
- **State**: Angular signals
- **Routing**: Angular Router

### Frontend entrypoints
- `src/app/services/tauri.service.ts` — **single** service wrapping every IPC call
- `src/app/models/photo.ts` — TypeScript interfaces (`Photo`, `Library`, `ScanProgress`, …)
- `src/app/components/` — `gallery/`, `library-selector/`, `photo-viewer/`, `sidebar/`

### Backend modules (`src-tauri/src/`)
- `commands/mod.rs` — Tauri IPC command handlers (the only public API surface)
- `app/mod.rs` — global `AppState` (scan-cancellation flag) + path resolution
- `catalog/` — library CRUD + DB init/migrations
- `scanner/` — recursive file discovery + incremental indexing
- `metadata/` — EXIF/metadata extraction
- `thumbnails/` — WebP 256×256 thumbnail generation
- `filesystem/` — filesystem helpers

## Non-obvious gotchas

- **Runtime data lives next to the executable**, not in OS app-data dirs.  
  `data/catalog.db`, `thumbnails/`, and `logs/` are all resolved from `std::env::current_exe()`.  
  During dev this means `src-tauri/target/debug/data/`.

- **Migrations auto-run at startup** via `catalog::init_database` in `lib.rs`.  
  Never run `sqlx migrate!` manually during dev.

- **IPC uses raw `window.__TAURI_INTERNALS__`** (see `tauri.service.ts`), not `@tauri-apps/api`.  
  Argument shapes must match exactly — e.g. `page`/`limit` are wrapped as `{ value: n }`.

- **Tauri IPC command names**: camelCase in JS → snake_case in Rust (automatic).

- **Angular 22 uses the new `@angular/build:application`** (esbuild).  
  No `ng test`, `ng e2e`, or karma config exists.

- **`delete_library` does NOT delete photos from disk** — only removes DB records.

- **Scan cancellation** flows through `AppState.scan_cancelled` (`Arc<RwLock<bool>>`),  
  polled in the scanner loop and set by the `cancel_scan` command.

- **Bootstrap CSS/JS must be in `angular.json`** — otherwise layout breaks silently.

- **Optimus UI `p-card` ignores `max-width`** — use `style="width: 100% !important"` when needed.
