# AGENTS.md

PhotoVault: app portátil (sem instalação) para organizar bibliotecas de fotos.
Stack: Angular 22 (zoneless, signals) + Optimus UI v2 + Tailwind 4 + PrimeIcons · Tauri 2 + Rust 2024 · SQLite (WAL).
Alvos: Windows 11 e Linux; Android no futuro.

**Leia antes de mudar algo:** [docs/PRD.md](docs/PRD.md) (requisitos e regras de negócio) e [docs/PLANO.md](docs/PLANO.md) (diagnóstico, ADRs e fases, com a fase atual marcada).

## Commands

```bash
npm install                       # dependências do frontend
npm run tauri:dev                 # dev completo: Angular (ng serve) + backend Rust
npm test                          # Vitest (frontend)
npm run build                     # só Angular

cargo test --workspace            # testes Rust; também regenera os bindings TS
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all
cargo run --release -p photovault-core --example ingest_bench -- <pasta> [cpu] [io]   # vazão scan+análise
cargo run --release -p photovault-core --example query_bench                          # latência das consultas (50 mil itens)
python3 crates/photovault-core/tests/labeled/generate.py <fotos-reais> <pasta>          # conjunto rotulado (~190 imagens)
cargo run --release -p photovault-core --example analysis_eval -- <pasta>              # precisão/recall das heurísticas
cargo run --release -p photovault-core --example hash_eval -- <fotos-reais>            # compara algoritmos de hash

npx tauri build --bundles appimage   # Linux  → depois: npm run package:portable
npx tauri build --no-bundle          # Windows → depois: npm run package:portable
```

- Linux precisa de: `build-essential pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf`.
- CI: `.github/workflows/ci.yml` (Windows + Ubuntu 22.04). Release portátil: `release.yml` (tags `v*`).

## Arquitetura

```text
crates/photovault-core/   domínio, SEM Tauri: db, catalog (query, media, albums, overview, libraries,
                          settings, organize), ingestion (MediaSource, scanner,
                          metadata, processor, geo), jobs (fila de análise), thumbnails, paths,
                          volume, analysis (metrics, classify, bktree, grouping, store, VisionAnalyzer)
src-tauri/                camada fina: commands/, events.rs, protocol.rs (pv://), state.rs, lib.rs
src/app/core/             ipc/ (bindings.ts gerado, ipc.ts, backend.ts), stores/ (signals), format, notify
src/app/layout/           shell, sidebar, topbar (busca Ctrl+K), info-panel, bottom-nav, nav.ts
src/app/features/         home, photos, timeline, favorites, albums, viewer, libraries, settings, welcome
src/app/shared/           media-grid/ (grade virtualizada), media-tile, filter-bar, selection-bar,
                          album-picker, gallery-controls, media-details, job-status, empty-state
```

- **Regra de negócio vai no core** (`photovault-core`), com teste. Os commands só adaptam para IPC.
- **Estado do frontend fica nas stores.** Globais: `AppStore`, `LibraryStore`, `ScanStore`, `JobStore`, `SelectionStore` (foco do painel + seleção múltipla), `BrowseStore` (filtros de "Todas as fotos", persistidos por biblioteca, e busca), `AlbumStore`, `OrganizeStore` (contadores de Organizar), `ViewerContext`, `UiStore`. Por página: `GalleryStore` (`providers: [GalleryStore]`), que junta o filtro fixo da página ao do usuário, pagina e se atualiza sozinho. Os componentes não chamam IPC direto, exceto em casos pontuais pelo `Backend`.

## Gotchas

- **Contrato IPC gerado:** `src/app/core/ipc/bindings.ts` vem do `tauri-specta`. Nunca edite à mão. Ao mudar um command, DTO ou evento em Rust, rode `cargo test -p photovault export_bindings` (o debug também regenera) e faça commit do arquivo. O CI falha se ele estiver desatualizado.
- **Use `unwrap(commands.x(...))`** de `ipc.ts`: ele converte o `Result` em valor ou `IpcError { code, message }`. Os códigos vêm de `photovault_core::Error::code()`.
- **Nada de `i64`/`u64` nos DTOs:** o specta proíbe BigInt. Use `u32`, ou `u64` com `#[specta(type = specta_typescript::Number)]` para bytes.
- **Dados de runtime** (`data/`, `thumbnails/`, `cache/webview/`, `logs/`): a ordem de resolução é `PHOTOVAULT_HOME`; depois o diretório do AppImage ou do exe, se houver `portable.flag` (ou se for build de debug); por fim, a pasta de dados do SO. Em dev isso fica em `target/debug/`. Use `PHOTOVAULT_HOME=/tmp/pv` para testar com um catálogo limpo.
- **A janela é criada em `lib.rs`** (`"create": false` no conf) para fixar o perfil do WebView em `cache/webview`. Não volte a criá-la pelo conf.
- **Imagens e vídeos entram só pelo protocolo `pv://`** (`thumbnailUrl`/`mediaUrl`), resolvidos por id do catálogo, com `Range` para vídeo. A CSP bloqueia `fetch` para `pv:`; use `<img>` ou `<video>`.
- **CSP** em `tauri.conf.json` (`csp` e `devCsp`). Estilos inline são permitidos porque o Optimus injeta `<style>`.
- **Nunca abra pool SQLite por command** (use `state.pool`). **Nunca decodifique imagem em `async` sem `spawn_blocking`.**
- **`relative_path` sempre com `/`.** Migrations em `crates/photovault-core/migrations/` são imutáveis. Um catálogo v0.x é arquivado automaticamente (`db::open`).
- **Ingestão em duas etapas:** o `scanner` só descobre arquivos e faz o diff (novo/modificado/ausente); nenhum arquivo é decodificado ali. Cada arquivo novo ou modificado vira um job `ingest` (tabela `jobs`), que o `JobRunner` processa em segundo plano: uma leitura por arquivo gera SHA-256, EXIF, miniaturas 256/1024 com orientação, pHash e local (GPS). Depois de um scan, chame `state.jobs.wake()`.
- **Status dos jobs:** `failed` = problema no arquivo (aparece em Configurações → Análise); `skipped` = formato ainda sem suporte (HEIC). Ao adicionar suporte a um formato, crie uma migration que recoloque esses `skipped` na fila.
- **Arquivo movido** (novo com o mesmo SHA-256 de um `missing`) é religado ao registro antigo, preservando id, favoritos e álbuns. A linha nova é apagada e o evento `MediaUpdatedEvent.removedIds` avisa o frontend.
- **Pasta vazia com itens no catálogo** (disco desmontado deixando o ponto de montagem) é recusada pelo scan, que nunca marca a biblioteca inteira como `missing`.
- **Miniaturas versionadas:** `thumbnailUrl(id, item.thumbVersion)`. `thumbVersion` 0 = ainda não gerada (o tile tenta mesmo assim, para aproveitar miniaturas de catálogos antigos).
- **`captured_at` é hora local de parede** (`2025-07-12T14:32:01`, sem fuso) e `date_source` diz a origem (`exif_original` → `exif_datetime` → `file_meta` → `filename` → `mtime`).
- **Logs:** o filtro padrão é `info,nom_exif=error`. O `nom-exif` loga cada tag em INFO e encheria os arquivos de log.
- **Nada escreve dentro da pasta da biblioteca** (o teste `ingest_fills_metadata_thumbnails_and_place` compara o conteúdo da pasta antes e depois). `delete_library` não apaga fotos, só o índice e as miniaturas.
- **Tema:** preset `PhotoVaultPreset` (Aura azul) em `app.config.ts`. Sem preset, o Optimus renderiza sem estilo. O modo escuro é a classe `.dark-mode` no `<html>`, controlada pelo `AppStore`. Tokens de cor (`bg-canvas`, `bg-panel`, `text-muted`, `bg-side`…) ficam em `src/styles.css`.
- **Zoneless:** não há `zone.js`. Estado reativo sempre em signals; componentes `OnPush`.
- **Menu:** itens futuros ficam em `layout/nav.ts` com `phase`, e caem na página "em breve". Não crie links quebrados.
- **Uma consulta para tudo:** `MediaFilter` + `MediaSort` (`catalog::query`) servem galeria, contagem, contexto do visualizador e regra de álbum inteligente (`rule_json` = `MediaFilter` serializado). Novo filtro = campo em `MediaFilter` + cláusula em `push_where` + teste em `filters_combine`. O texto da busca é interpretado em `parse_text` ("julho 2025" vira data; o resto vai para FTS5).
- **Cada ordenação tem índice** (migration 0003) com a *mesma expressão* de `MediaSort::spec`. Mudou a expressão, crie o índice correspondente e rode o `query_bench` (meta: < 100 ms com 50 mil itens).
- **FTS5 (`media_fts`)** é mantido por triggers, com `rowid` = `media.rowid`. Nunca rode `VACUUM` sem reconstruir o índice depois.
- **Atualizações de mídia passam pelo `MediaBus`:** use `bus.subscribe(fn)`, nunca leia um signal de "último valor", porque duas publicações antes da detecção de mudanças perderiam a primeira. Edição local (ex.: favoritar via `MediaActions`) publica no bus; galerias, seleção e visualizador se atualizam.
- **Grade virtualizada** (`shared/media-grid`): linhas de altura conhecida (`layoutGrid`, função pura com teste), rolagem pelo `#main` do shell. Não coloque a grade dentro de outro contêiner com `overflow`. Cabeçalhos fixos de página levam `data-sticky-header` (o salto da timeline desconta a altura).
- **Visualizador fora do shell:** toast, confirmação e "Adicionar ao álbum" (`AlbumPicker`) ficam no `AppComponent`. Abra sempre por `ViewerContext.open(item, query)`, que guarda a consulta (para ←/→ e "12 / 426") e a URL de volta.
- **Voltar do visualizador** restaura itens e rolagem pelo `GalleryCache` (por página e consulta, 10 min).
- **Análise em três estágios** (`JobRunner::step`): `ingest` → `analyze` (por foto, lê só o preview de 1024 local: métricas, pHash DCT, screenshot/momentânea) → estágio global por biblioteca "suja" (`analysis_state`) quando as filas esvaziam: requalifica flags/rótulos com os limiares atuais e reconstrói grupos e sequências. Marque a biblioteca com `analysis::store::mark_dirty` sempre que algo mudar grupos (favoritos, ausentes).
- **Métricas brutas ficam no banco** (`media_quality`, score em `media_labels`); flags, nível e `active` são derivados. Mudar um limiar (`AnalysisSettings`) nunca exige reler fotos. Não grave flags "prontas" sem guardar a métrica que as gerou.
- **Heurísticas calibradas com dados:** qualquer mudança em `metrics`/`classify`/`grouping` deve ser medida com `analysis_eval` e o resultado registrado no PLANO. Metas: exata 100%, visual ≥ 95% de precisão, screenshot ≥ 90%.
- **pHash = DCT + mediana** (`metrics::perceptual_hash`), calculado no `analyze`. Hash de gradiente e DCT + média degeneram em imagens lisas. Hashes degenerados e imagens "vazias" ficam fora de duplicata e semelhante.
- **Screenshots não recebem nível de qualidade** (interface branca não é "estourada").
- **`pkill -f`/`pgrep -f`** com um padrão que aparece no próprio comando (ex.: "tauri dev", "ng serve") mata o shell. Use `pgrep -x photovault`/`pgrep -x Xephyr` ou filtre `ps -eo pid,comm`.
