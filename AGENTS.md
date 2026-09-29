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
cargo run --release -p photovault-core --example label_dump -- <pasta> [document|all|events] # rótulos/eventos de uma pasta
python3 crates/photovault-core/tests/labeled/trips.py <fotos-reais> <pasta>             # biblioteca com viagens (EXIF data + GPS)
python3 crates/photovault-core/data/build_cities.py cities1000.txt admin1CodesASCII.txt # regenera data/cities.tsv.gz (GeoNames)

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
                          volume, analysis (metrics, classify, bktree, grouping, store, descriptor,
                          VisionAnalyzer), review (sugestões, exemplos), trash (lixeira + operations_log),
                          events (detect: viagens/eventos)
src-tauri/                camada fina: commands/, events.rs, protocol.rs (pv://), state.rs, lib.rs
src/app/core/             ipc/ (bindings.ts gerado, ipc.ts, backend.ts), stores/ (signals), format, notify
src/app/layout/           shell, sidebar, topbar (busca Ctrl+K), info-panel, bottom-nav, nav.ts
src/app/features/         home, photos, timeline, favorites, albums, organize, review, trash, trips, viewer,
                          libraries, settings, welcome
src/app/shared/           media-grid/ (grade virtualizada), media-tile, filter-bar, selection-bar,
                          album-picker, confirm-action, gallery-controls, media-details,
                          media-analysis, media-review, event-card, job-status, empty-state
```

- **Regra de negócio vai no core** (`photovault-core`), com teste. Os commands só adaptam para IPC.
- **Estado do frontend fica nas stores.** Globais: `AppStore`, `LibraryStore`, `ScanStore`, `JobStore`, `SelectionStore` (foco do painel + seleção múltipla), `BrowseStore` (filtros de "Todas as fotos", persistidos por biblioteca, e busca), `AlbumStore`, `OrganizeStore` (contadores de Organizar), `EventStore` (viagens/eventos), `ViewerContext`, `UiStore`. Por página: `GalleryStore` (`providers: [GalleryStore]`), que junta o filtro fixo da página ao do usuário, pagina e se atualiza sozinho. Os componentes não chamam IPC direto, exceto em casos pontuais pelo `Backend`.

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
- **Duplicata visual = pHash próximo E mesma cor** (`metrics::color_layout` / `color_distance`, limiar `colorDistance`). O pHash só vê luminância: sem a cor, a mesma camisa em azul e em cinza vira "duplicata".
- **Documento exige linhas de texto** (`metrics::text_lines` ≥ `classify::MIN_TEXT_LINES`). Claro + sem cor + bordas também descreve pessoas e objetos em fundo branco. Screenshots nunca viram documento.
- **Sugestões (`review`) são derivadas no estágio global**, depois dos grupos: nunca grave `review_candidates` fora de `review::rebuild`/`decide`/`on_trash`. Decisões (`kept`, `ignored`, `trashed`) sobrevivem a toda reconstrução; favoritas e a melhor candidata de um grupo nunca são candidatas. `media.review_priority` alimenta a ordenação `priority` (índice `idx_media_review`, mesma expressão).
- **Lixeira = `rename` para `.photovault-trash/<data>/<caminho>`** na própria biblioteca; a linha da mídia passa a apontar para lá (`status = 'trashed'`, `inTrash` no DTO). Toda operação física grava `operations_log` antes e fecha depois; `trash::recover` roda na inicialização. Nunca apague um arquivo sem passar por `trash::purge`.
- **Ações que mexem em arquivos passam por `MediaActions`**, que confirma com `ConfirmAction` (dupla para excluir; número digitado acima de 500 itens). Não chame `trashMedia`/`purgeMedia` direto de componentes.
- **Exemplos** (`review::examples`) guardam o próprio descritor e miniatura (data URL): sobrevivem à foto de origem. O `descriptor` compara aspecto, não conteúdo; ao trocar as features, mude `DESCRIPTOR_LEN` (descritores de outro tamanho são ignorados) e reanalise.
- **Viagens/eventos (`events`) são derivados no estágio global**, depois das sugestões. Só `suggested` é refeito; `accepted` absorve fotos novas das suas datas, `edited` nunca muda e `ignored` bloqueia sugestões com ≥ 50 % das mesmas fotos. Fotos com `date_source = 'mtime'` não entram (datas de cópia).
- **Geocodificação = `data/cities.tsv.gz` (GeoNames CC BY 4.0) embutido**, lido por `ingestion::geo`. Ao mudar a tabela ou a escolha do lugar, troque `GEOCODER_VERSION`: os locais de todos os catálogos são recalculados uma vez (`geo::refresh_places`). Mantenha a atribuição do GeoNames no README e em Configurações → Sobre.
