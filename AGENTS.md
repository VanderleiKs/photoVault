# AGENTS.md

PhotoVault: app portátil (sem instalação) para organizar bibliotecas de fotos.
Stack: Angular 22 + Tauri 2 (Rust) + SQLite (WAL). Alvos: Windows 11 e Linux; Android no futuro.

**Leia antes de mudar algo:** [docs/PRD.md](docs/PRD.md) (requisitos e regras de negócio) e [docs/PLANO.md](docs/PLANO.md) (diagnóstico, ADRs e fases, com a fase atual marcada).

## Commands

```bash
npm install                       # dependências do frontend
npm run tauri:dev                 # dev completo: Angular + backend Rust
npm run tauri:build               # build de produção
npm run build                     # só Angular (sem backend)

cd src-tauri
cargo test                        # testes do backend (catálogo, scanner, protocolo)
cargo clippy --all-targets -- -D warnings
cargo fmt
```

- Linux precisa de: `build-essential pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf`.
- Ainda não há testes nem linter no frontend (ver a Fase 1 do plano).
- CI: `.github/workflows/build.yml` (só Windows por enquanto).

## Arquitetura

| Camada | Local | Linguagem |
|--------|-------|-----------|
| Frontend | `src/` | Angular 22 (standalone, signals) + Bootstrap 5.3 (sai na Fase 1) + Optimus UI v2 + PrimeIcons |
| Backend | `src-tauri/` | Rust 2024 / Tauri 2 |

### Frontend
- `src/app/services/tauri.service.ts`: **único** ponto de IPC, usando `@tauri-apps/api` (`invoke`, `listen`, `convertFileSrc`).
- `src/app/models/photo.ts`: interfaces TS; devem espelhar as structs `Serialize` do Rust.
- `src/app/components/`: gallery, timeline, duplicates, photo-viewer, library-selector, sidebar.

### Backend (`src-tauri/src/`)
- `lib.rs`: bootstrap (logs, pool, protocolo `pv://`, commands).
- `app/`: `AppState { pool, paths, scan }`, resolução do diretório portátil e guard de scan único.
- `commands/`: handlers IPC (única API pública). Todos usam `state.pool`.
- `catalog/`: bibliotecas, fotos, navegação, conexão SQLite e migrations.
- `scanner/`: descoberta recursiva e indexação incremental. Emite `scan_progress`, `scan_complete` e `scan_error`.
- `protocol.rs`: `pv://localhost/thumb/<id>` e `pv://localhost/media/<id>`.
- `metadata/`, `thumbnails/`: funções **bloqueantes**, sempre chamadas via `spawn_blocking`.

## Gotchas

- **Dados de runtime ficam ao lado do executável** (`data/catalog.db`, `thumbnails/`, `logs/`). A ordem de resolução é `PHOTOVAULT_HOME`, depois o diretório do `$APPIMAGE`, depois o diretório do exe. Em dev isso é `src-tauri/target/debug/`. Use `PHOTOVAULT_HOME=/tmp/pv` para testar com um catálogo limpo.
- **Argumentos IPC são valores simples** com nomes camelCase em JS (`{ libraryId, page, limit }`), convertidos para snake_case no Rust automaticamente. As respostas de dados (`Photo`, `Library`) usam snake_case; os payloads de eventos usam camelCase.
- **Nunca abra um pool SQLite por command**: use `State<Arc<AppState>>`.
- **Nunca faça decodificação de imagem ou I/O pesado dentro de `async fn` sem `spawn_blocking`.**
- **Imagens chegam ao frontend pelo protocolo `pv://`**, resolvidas por id do catálogo (nunca por caminho vindo do frontend). Proibido base64 via IPC. Use `tauri.thumbnailUrl(id)` / `tauri.mediaUrl(id)`.
- **`relative_path` sempre usa `/`**, em qualquer SO (ver `scanner::normalize_relative_path`).
- **Migrations rodam sozinhas no startup** (`catalog::init_database`). São imutáveis: crie um arquivo novo em vez de editar um antigo.
- **Capabilities** em `src-tauri/capabilities/default.json`. Sem `core:default`, `listen()` falha em silêncio.
- **`delete_library` não apaga fotos do disco**, só os registros (em cascata).
- **Nada escreve dentro da pasta da biblioteca durante o scan.** O teste `scan_is_incremental_and_never_touches_originals` garante isso.
- **Bootstrap CSS/JS precisam estar em `angular.json`** enquanto o Bootstrap existir.
- **`p-card` do Optimus ignora `max-width`**: use `style="width: 100% !important"`.
