# PhotoVault — Diagnóstico e Plano de Conclusão

> **Data:** 2026-09-28 · **Base:** commit `f5d4d90` ("fase 4") · **Requisitos:** [PRD.md](PRD.md)

---

## 1. Diagnóstico do estado atual

### 1.1 O que existe

| Área | Situação |
|------|----------|
| Backend Rust | ~1.100 linhas: criar/listar/remover biblioteca, scanner recursivo, miniatura 256 px, IPC básico |
| Frontend Angular | 6 componentes (seletor de biblioteca, galeria, timeline, visualizador, duplicatas, sidebar) com Bootstrap + Optimus |
| Banco | 1 migration (`libraries`, `photos`) |
| CI | `.github/workflows/build.yml`: só Windows, gera instalador (não portátil) |
| Testes | nenhum |

Verificação feita nesta análise: o `npm install --legacy-peer-deps && ng build` **compila**. O `cargo check` não pôde ser executado nesta máquina (falta o linker `cc`; instale `build-essential`), então o diagnóstico do Rust abaixo vem de leitura de código.

### 1.2 Defeitos críticos (o app não funciona por causa deles)

| # | Defeito | Onde | Efeito |
|---|---------|------|--------|
| C1 | O frontend envia `page: { value: n }` e `limit: { value: n }`, mas o Rust espera `i64` | `tauri.service.ts` `loadPhotos` | `get_photos` **sempre falha** na desserialização e a galeria fica vazia. O AGENTS.md documenta esse formato errado como regra. |
| C2 | `window.__TAURI_INTERNALS__.event` não existe no Tauri 2 | `tauri.service.ts` `registerEventListeners` | Nenhum listener é registrado: o progresso nunca aparece e `isScanning` nunca volta a `false`. |
| C3 | Não existe `src-tauri/capabilities/` | — | Sem `core:default`, a API de eventos do frontend também é negada. |
| C4 | A URL `sqlite://<path>` é aberta sem `create_if_missing` | `catalog::init_database` | Na primeira execução o arquivo não existe e dá "unable to open database file". O *retry* de 5 tentativas não resolve (é sintoma, não correção). No Windows, `sqlite://C:\...` também é frágil. |
| C5 | Um pool SQLite novo é criado **a cada command** | `commands/mod.rs` (todos) | Lento, sem os PRAGMAs de WAL e ignora o pool criado no `setup` (que é descartado). |
| C6 | Miniaturas nunca carregam em Timeline e Duplicatas (`thumbnailCache` nunca é preenchido) e a fila da galeria descarta as `resolve` das requisições enfileiradas | `timeline`, `duplicates`, `tauri.service.ts` `processThumbnailQueue` | Placeholders eternos e promessas que nunca resolvem. |
| C7 | O `sha256` nunca é calculado | scanner | A tela de Duplicatas é sempre vazia. |
| C8 | O visualizador mostra a **miniatura de 256 px** como imagem principal, e a navegação anterior/próxima ignora `library_id`, pula fotos com o mesmo `captured_at` e quebra quando `captured_at` é NULL | `photo-viewer`, `get_photo_navigation` | O visualizador fica inutilizável. |
| C9 | Timeline e Duplicatas carregam 10.000 itens no signal **compartilhado** `photos` | `timeline`, `duplicates` | Sobrescrevem a galeria e não escalam. |

### 1.3 Defeitos de regra de negócio (violam o PRD)

- **Incremental incompleto:** compara só `size`, não guarda `mtime`, não detecta arquivos removidos nem movidos.
- **`captured_at` é sempre o mtime**, embora rotulado como EXIF. Não há EXIF nem `date_source`.
- **`relative_path` usa o separador do SO** (`\` no Windows). O mesmo HD aberto no Linux não bate com o catálogo (viola R8).
- **`root_path` absoluto sem relocalização:** trocar `E:` por `F:` quebra a biblioteca.
- **Não é portátil de verdade:** o WebView2/WebKitGTK grava o perfil em `%LOCALAPPDATA%`/`~/.local/share`, e no AppImage o `current_exe()` aponta para um ponto de montagem somente leitura.
- **Logs em release não existem:** `windows_subsystem = "windows"` esconde o stderr, e `log_to_file` só cobre o boot.
- **Decodificação de imagem dentro de task async** (`image::open` sem `spawn_blocking`), processamento sequencial e WebP **lossless** (arquivos grandes, lento). A orientação EXIF é ignorada.
- **Dois scans simultâneos** compartilham o mesmo flag de cancelamento.
- **Lixeira em `filesystem/`** usa `rename` para outro volume (falha entre discos) e não registra nada no banco.

### 1.4 Frontend / layout

- Não há *shell*: cada página reimplementa sidebar e header, e o layout não corresponde ao mockup.
- Bootstrap e Optimus misturados. Classes `p-card` são usadas como CSS cru em vez de componentes. Muitos `style=""` inline.
- Itens de menu "Viagens" e "Revisão" levam para a galeria.
- `zone.js` + `provideAnimations` (obsoletos no Angular 22), hack `photos.update(p => [...p])` para forçar re-render e `alert()` para erro.
- `@angular/cdk` (peer obrigatório do Optimus) não está no `package.json`. É por isso que o `--legacy-peer-deps` é necessário.

### 1.5 Documentação incorreta

- `AGENTS.md` diz que não há CI (há `build.yml`), manda usar `{ value: n }` (causa do C1) e manda usar IPC cru.
- `README.md` fala em Tailwind v4 (o projeto usa Bootstrap), numera fases diferentes das do PRD e marca como feitas coisas que não funcionam.
- O `.gitignore` ignora `build.yml` e `.vscode/`.

### 1.6 Código a remover

| Item | Motivo |
|------|--------|
| `get_thumbnail` e `get_thumbnail_data_url` (base64) | substituídos pelo protocolo `pv://` |
| `filesystem::move_to_trash` / `restore_from_trash` / `path_exists` / `get_file_size` / `is_readable` | código morto; a lixeira será reescrita (fase 5) |
| `app::get_logs_dir`, `log_to_file` | substituídos por `tracing-appender` |
| `AppState::app_handle` | desnecessário |
| retry loop em `init_database` | mascara o C4 |
| Deps `tauri-plugin-fs`, `mime_guess`, `anyhow` (no core), `base64`, `dirs` (se não usado) | sem uso |
| `bootstrap`, `zone.js`, `@angular/animations` | trocar por Tailwind + zoneless |
| Componentes `timeline`, `duplicates`, `gallery`, `library-selector`, `sidebar`, `photo-viewer` atuais | reescritos sobre o novo shell (fase 1/3). Os úteis (lógica de zoom e teclado do viewer) são aproveitados. |
| `src/app/models/photo.ts` manual | substituído por `bindings.ts` gerado |

---

## 2. Decisões de arquitetura (ADRs resumidos)

| ADR | Decisão | Motivo |
|-----|---------|--------|
| 001 | **Tailwind 4 + tailwindcss-primeui** no lugar do Bootstrap | o PRD original prevê Tailwind, e ele integra com os tokens do Optimus/PrimeNG. O layout vai ser reescrito de qualquer forma. *Se preferir manter Bootstrap, o resto do plano não muda.* |
| 002 | **Workspace Cargo** com `crates/photovault-core` sem Tauri | permite testar o core com `cargo test`, reusar no Android e manter os commands finos |
| 003 | **tauri-specta** gera os tipos TS | elimina a classe de bug C1/C2 |
| 004 | **Protocolo `pv://`** para imagens | elimina base64 via IPC; permite cache, `Range` (vídeo) e lazy loading nativo do `<img>` |
| 005 | **Fila de jobs persistida no SQLite** + rayon + semáforo de I/O | pipeline retomável e throttling para HD externo |
| 006 | **Lixeira dentro da raiz da biblioteca** (`.photovault-trash`) | `rename` atômico no mesmo volume |
| 007 | **Portátil = zip (Windows) + AppImage (Linux)**, sem instaladores | requisito do produto |
| 008 | **Migrations: recomeçar do zero** (`0001_init.sql` novo) | não há usuários com dados; o schema atual é insuficiente. O `catalog.db` antigo é descartado com aviso. |

---

## 3. Plano por fases

Cada fase termina com o app **executável e utilizável** e com o CI verde. As estimativas consideram 1 desenvolvedor em tempo integral.

### Fase 0 — Estabilização e limpeza (≈ 3 dias) → `v0.2` ✅ implementada (branch `fase-0-estabilizacao`)

**Objetivo:** o app atual passa a funcionar ponta a ponta (criar biblioteca, escanear, ver a galeria) e o código morto sai. Serve como base limpa.

- [x] C4/C5: `SqliteConnectOptions` com `create_if_missing`, WAL e `foreign_keys`; pool único em `AppState`; retry removido
- [x] C1: `page`/`limit` como números
- [x] C3: `capabilities/default.json` com `core:default` (o dialog é chamado pelo Rust, então dispensa permissão no frontend)
- [x] C2: `@tauri-apps/api` (`invoke`, `listen`, `convertFileSrc`)
- [x] C6: protocolo `pv://thumb` e `pv://media` (só imagens), **antecipado da Fase 1**. Com ele saem a fila de base64, o IntersectionObserver e o cache manual.
- [x] C8: o visualizador usa o original (com fallback para a miniatura); navegação por biblioteca com desempate por id e datas nulas no fim; o handler de teclado duplicado (que pulava 2 fotos) foi removido
- [x] C9: Timeline e Duplicatas usam `fetchPhotos` local, sem sobrescrever a galeria
- [x] `relative_path` normalizado para `/` + migration `002` convertendo catálogos antigos
- [x] Descoberta, metadados e miniaturas em `spawn_blocking`; `thumbnail()` no lugar de Lanczos3; escrita atômica da miniatura (tmp + rename)
- [x] Scan: um por vez (guard), cancelamento sempre emite `scan_complete { cancelled }`, pastas de sistema e a `.photovault-trash` ignoradas, carga única do catálogo para o diff, miniatura regenerada se tiver sumido, hash/qualidade invalidados em arquivo modificado
- [x] Logs em arquivo (`tracing-appender`, rotação diária) e resolução portátil de `base_dir` (`PHOTOVAULT_HOME`, `$APPIMAGE`, exe), **antecipado da Fase 1**
- [x] Código morto removido: `filesystem/`, `get_thumbnail*`, `log_to_file`, deps `tauri-plugin-fs`, `base64`, `mime_guess`, `anyhow`, `dirs`, `thiserror`, `sha2` (as duas últimas voltam quando forem usadas)
- [x] `@angular/cdk` adicionado: `npm install` funciona sem `--legacy-peer-deps`
- [x] Erros visíveis na UI (sem `alert()`); links "Viagens" e "Revisão" desativados ("em breve")
- [x] `AGENTS.md`, `README.md` e `.gitignore` corrigidos
- [x] Testes: 9 no backend (`cargo test`), incluindo um scanner de ponta a ponta com arquivo corrompido, reescaneamento, arquivo modificado, cancelamento e a garantia de que os originais não mudam
- [ ] ~~WebP com perda~~: o crate `image` só codifica WebP lossless, então isso **foi para a Fase 2** (crate `webp`)

- [x] Descobertos no teste de UI e corrigidos: **tema Optimus sem preset** (todos os componentes ficavam sem estilo) → `@openng/optimus-ui-themes` + preset Aura com primária azul; sidebar sem altura total (`html/body/app-root` a 100%)

**Aceite:** num Linux e num Windows 11 limpos, criar uma biblioteca com 1.000 fotos, ver o progresso, cancelar, reescanear e ver a galeria com miniaturas.

**Validação no Linux (2026-09-28, Zorin OS 18, AppImage de release, UI dirigida pelo inspetor do WebKit):** ✅
criação pela UI (e erro de pasta inexistente na tela), scan com progresso (descoberta, depois indexação), estatísticas corretas, `.photovault-trash` ignorada, miniaturas reais e placeholder no arquivo corrompido, paginação (86/86), visualizador com o original (3840×2560) e ←/→ andando 1 foto, Esc, Timeline, reescaneamento incremental (0 novos em 0,3 s), cancelamento (0,9 s) e retomada (+2.509 = restante exato), scan concorrente recusado, `pv://` recusando traversal e id inexistente, dados ao lado do `.AppImage`, persistência após reiniciar e originais com hash idêntico.
**Windows 11:** pendente.

**Achados para as próximas fases:**
- Vazão de indexação de **~23 arquivos/s** (fotos 4K, sequencial). A meta de 50 mil em menos de 5 min exige paralelismo → prioridade da Fase 2 (fila + rayon).
- HEIC sem miniatura (esperado; Fase 2).
- O `tauri build` padrão também gera `.deb` e `.rpm`; o release portátil deve usar só `--bundles appimage` (Fase 1).

---

### Fase 1 — Fundação (≈ 2 semanas) → `v0.3` ✅ implementada (branch `fase-1-fundacao`)

**Backend**
- [x] Workspace Cargo (`Cargo.toml` na raiz) com `crates/photovault-core` sem Tauri: `db`, `catalog` (libraries, media, settings), `ingestion` (source, local, scanner, control, metadata), `thumbnails`, `paths`, `volume`, `analysis::vision`
- [x] `paths`: `PHOTOVAULT_HOME` → pasta do AppImage/exe com `portable.flag` (ou build debug) → pasta do SO; o modo aparece em Configurações
- [x] Perfil do WebView em `base_dir/cache/webview` (janela criada em `lib.rs` com `data_directory`); verificado que nada é gravado em `~/.local/share`
- [x] `Error` com `code()` estável + `ApiError { code, message }` em pt-BR
- [x] Migration `0001_init.sql` com o schema completo (FTS5 fica para a migration da Fase 3); catálogo v0.x **arquivado automaticamente**, preservando as bibliotecas (ADR-008)
- [x] `tauri-specta` rc.25: `src/app/core/ipc/bindings.ts` gerado (debug e `cargo test`); o CI verifica se está atualizado; bytes como `u64` + `specta(type = Number)`
- [x] `pv://media` com `Range` (206) para vídeo; `pv://thumb`; ids validados
- [x] CSP restritiva (`csp` + `devCsp` para o live reload); capabilities `core:default`
- [x] Traits `MediaSource` + `LocalFolderSource` e `VisionAnalyzer`
- [x] Paginação por keyset (cursor opaco) + navegação com posição ("12 / 426")
- [x] Bibliotecas: validação, pasta duplicada recusada, renomear, **relocalizar** (confere uma amostra de arquivos conhecidos), remoção apagando as miniaturas
- [x] Antecipado da Fase 2: comparação por **mtime** (tolerância de 2 s) além do tamanho; `[profile.dev.package."*"] opt-level = 2` (dev muito mais rápido)

**Frontend**
- [x] Sem Bootstrap, `zone.js` nem `@angular/animations`; Tailwind 4 + `tailwindcss-primeui`; zoneless; todos os componentes OnPush
- [x] Preset Aura azul + tokens claro/escuro do PRD 23.7 (`bg-canvas`, `bg-panel`, `bg-side`…), tema claro/escuro/sistema persistido
- [x] `src/app/{core,layout,features,shared}` com rotas lazy
- [x] **Shell** do mockup: sidebar escura (grupos Principal/Organizar/Biblioteca, recolhível, volume com espaço livre), topbar (seletor de biblioteca, busca, Importar, tema, menu), painel "Informações", bottom nav abaixo de 768 px
- [x] Stores com signals: `AppStore`, `LibraryStore`, `ScanStore` (no lugar de `JobStore`), `MediaStore`, `UiStore`
- [x] Toasts (sem `alert()`), `ConfirmDialog`, skeletons e estados vazios (sem fotos, biblioteca desconectada)
- [x] Telas: **Todas as fotos** (grade com rolagem infinita, slider de tamanho, progresso, atualização durante o scan), **Timeline**, **Visualizador** (escuro, zoom, teclado, vídeo, detalhes), **Bibliotecas**, **Configurações**, **Boas-vindas**, e "em breve" (com a fase de entrega) para os itens ainda não implementados
- [ ] Busca: campo presente e desabilitado (Fase 3)
- [ ] Alternância grade/lista e badges de contagem do menu Organizar (entram com os dados das Fases 3 e 4)
- [ ] Painel de informações como `Drawer` em telas estreitas (hoje fica oculto abaixo de 1024 px)

**Qualidade/entrega**
- [x] 22 testes Rust (core: paths, migrations, catálogo legado, libraries, keyset, settings, scanner de ponta a ponta; Tauri: protocolo e `Range`) + 11 testes Vitest (format, `unwrap`, `LibraryStore`, `MediaStore`)
- [x] `ci.yml`: matriz `windows-latest` + `ubuntu-22.04` com fmt, clippy `-D warnings`, `cargo test`, bindings atualizados, `ng build`, `ng test`
- [x] `release.yml` + `scripts/package-portable.mjs`: zip portátil (Windows) e AppImage (Linux), com `portable.flag` e `LEIA-ME.txt`
- [ ] Teste manual no Windows 11 e a partir de um pendrive (o Linux já foi validado)

**Aceite:** o app abre no shell novo, gerencia bibliotecas e roda portátil nos dois SOs. O visual da sidebar/topbar corresponde ao mockup.

**Validação no Linux (2026-09-28, AppImage de release e `tauri dev`, UI dirigida pelo inspetor do WebKit):** ✅
catálogo v0.x arquivado com as 3 bibliotecas mantidas; onboarding numa instalação limpa (86 arquivos em ~6 s); troca de biblioteca pela topbar; galeria sendo preenchida durante o scan (4 → 120 itens); cancelamento (1,2 s) com toast de resumo; reescaneamento sem mudanças em 59 ms; seleção e painel de informações; visualizador ("5 / 189", ←/→, `i`, Esc) mantendo a seleção; tema escuro persistido; biblioteca desconectada, depois relocalização (pasta errada recusada com `RELOCATION_MISMATCH`, pasta certa aceita); remoção com confirmação apagando 27 miniaturas e mantendo os arquivos; modo portátil com zero gravações fora da pasta; live reload sob a `devCsp`.
**Windows 11:** pendente (o CI compila e testa; falta o teste manual).

**Achados:**
- A CSP bloqueia `fetch` para `pv:` (esperado; o app só usa `<img>`/`<video>`).
- A vazão do scan continua sequencial (~16–25 arquivos/s): paralelizar é a prioridade da Fase 2.

---

### Fase 2 — Ingestão completa (≈ 2,5 semanas) → `v0.4` ✅ implementada, exceto HEIC e miniaturas de vídeo (branch `fase-2-ingestao`)

- [x] Scanner: exclusões (pastas ocultas, `$RECYCLE.BIN`, `System Volume Information`, `@eaDir`, `#recycle`, AppleDouble `._*`, arquivos < 1 KB), lock por biblioteca e cancelamento (já existiam); scan agora só descobre e compara, sem decodificar (21 mil arquivos/s)
- [x] Diff incremental completo: novo, modificado (size + mtime ± 2 s), ausente (`missing`, nunca apagado), restaurado, **movido** (SHA-256 igual ao de um `missing` → religa ao registro antigo, preservando id e favoritos); pasta vazia com catálogo cheio é recusada (disco desmontado)
- [x] Módulo `jobs`: fila persistida em `jobs`, job `ingest` idempotente, retomada após reiniciar (`running` → `queued`), pausar/retomar (inclusive no meio de um lote), workers `spawn_blocking` limitados por semáforo de CPU + portão de I/O configurável; bibliotecas desconectadas ficam na fila
- [x] Progresso via eventos (`JobProgressEvent`: fila, feitos, falhas, itens/min, ETA; `MediaUpdatedEvent` em lote), no lugar de `Channel`
- [x] Metadados: `nom-exif` (EXIF + trilha de vídeo MP4/MOV), cadeia de data com `date_source` (EXIF original → EXIF DateTime → contêiner → nome do arquivo → mtime), data a partir de `IMG_20250712_143201`, `PXL_…`, `IMG-…-WA…`, `Screenshot_…`; fuso do EXIF guardado em `captured_at_local`
- [x] Miniaturas 256 e 1024 (`fast_image_resize` Lanczos3), WebP com perda (q80, `method 2`), orientação aplicada; `thumb_version` evita cache velho no WebView; `pv://preview` para o visualizador
- [x] SHA-256 (streaming para vídeo) e pHash (gradiente 64 bits, `phash_distance`)
- [ ] HEIC atrás da feature `heic` (libheif empacotada): **pendente**. Hoje o HEIC é catalogado com EXIF completo (data, câmera, GPS) e o job fica `skipped`, sem miniatura
- [~] Vídeo: duração, dimensões, data e GPS do contêiner ✅; miniatura com sidecar ffmpeg (feature `video-thumbs`): **pendente**
- [x] Geocodificação offline (`reverse_geocoder`, GeoNames embutido) → `places` (estados do Brasil como sigla, país localizado na interface)
- [x] Configurações → "Análise em segundo plano": estado, pausar/retomar, lista de arquivos com problema e "Reprocessar"; indicador compacto na galeria
- [x] Fixtures em `crates/photovault-core/tests/fixtures/` (EXIF completo e rotacionado, só DateTime, sem EXIF com data no nome, par para pHash) + corrompido/HEIC gerados nos testes; teste que compara o conteúdo da pasta antes e depois. Teste `local_samples` (ignorado) roda com arquivos reais via `PV_SAMPLE_VIDEO`/`PV_SAMPLE_HEIC`

**Aceite:** 50 mil arquivos num HD USB indexados em menos de 5 min (estágios básicos); reescanear processa só a diferença; arquivos corrompidos aparecem no diagnóstico sem parar o scan.

**Medições (2026-09-28, i7-1255U 15 W, SSD, `ingest_bench`, fotos de 12 MP):**
- Estágios básicos (descoberta + diff + gravação no catálogo): **15.840 arquivos em 0,74 s**. O aceite de 50 mil em menos de 5 min está folgado no SSD; falta medir num HD USB real.
- Análise completa (hash, EXIF, 2 miniaturas, pHash, local): **64,7 arquivos/s** (v0.3: 16–25/s). 100 mil fotos ≈ 26 min em segundo plano, com a galeria navegável desde o início. O gargalo restante é a decodificação JPEG (~80 ms por foto de 12 MP); o próximo ganho é decodificar reduzido via DCT.
- Otimizações aplicadas: WebP `method 2` (2,5× mais rápido que o padrão, arquivo ~5% maior, sem diferença visível) e nenhuma cópia do buffer RGB.

**Validação no app (`tauri dev`, catálogo v0.3 migrado):** ✅ os 86 itens antigos voltaram para a fila e foram reprocessados; o painel mostra "Canela, RS · Brasil", "Apple iPhone 15 Pro" + lente e "f/1,8 · 1/1200 s · ISO 32 · 24 mm"; data do EXIF e dimensões com rotação corretas; as miniaturas aparecem sozinhas conforme a análise avança; o indicador mostra fila e ETA; a pausa congela a fila (165 → 162 em 4 s, só o que já estava em andamento); o JPG corrompido aparece em "Arquivos com problema".
**Bug encontrado e corrigido na validação:** pausar só valia para o lote seguinte (um lote de 198 arquivos continuava rodando); agora as tarefas conferem a pausa e voltam para a fila (teste `pause_stops_a_batch_midway`).

**Achados:**
- Um arquivo que passa a ser filtrado (por exemplo, < 1 KB) vira `missing` no próximo scan, embora continue no disco. Aceitável, mas pode confundir numa futura tela de "arquivos ausentes".
- A ordem da galeria muda quando a data do EXIF substitui a provisória: ela é reordenada quando a fila esvazia, se o usuário estiver na primeira página; mais abaixo, só ao recarregar.

---

### Fase 3 — Catálogo e navegação (≈ 3 semanas) → `v0.5` (primeira versão útil para o usuário) ✅ implementada (branch `fase-3-catalogo`)

- [x] **Início:** hero com foto de destaque (favorita em paisagem, senão uma recente), cards Fotos/Vídeos/Favoritos/Álbuns (Viagens entra na Fase 6), carrossel de anos com capa (leva à timeline no ano) e fotos recentes com slider e ordenação
- [x] **Todas as fotos:** grade virtualizada própria (linhas de altura conhecida; ~90 tiles no DOM com 50 mil itens), keyset em 4 ordenações, seleção múltipla (círculo, Ctrl/Shift+clique, Ctrl+A, Esc), coração na miniatura, duração do vídeo, barra de ações em lote
- [x] **Painel de informações:** metadados, local, favoritar, álbuns da foto, "Adicionar ao álbum"
- [x] **Visualizador:** preview de 1024 na hora e troca para o original quando carrega (HEIC/TIFF ficam no preview), "n / total" no contexto de origem (filtro, álbum, favoritos, timeline), tira de miniaturas, teclado (← → Esc F I + − 0), vídeo, painel Detalhes com ações; Esc volta para a página de origem com a rolagem restaurada
- [x] **Timeline:** Ano → Mês → Dia (cabeçalhos com totais do backend), scrubber de anos que carrega até o ano escolhido, deep link `?year=`
- [x] **Favoritos:** toggle na miniatura, no painel, no visualizador (F) e em lote; filtro e tela
- [x] **Filtros combinados** (tipo, favoritas, ano, mês, local, câmera) com chips removíveis, persistidos por biblioteca, e **busca Ctrl+K** com FTS5 (nome, pasta, local, álbum; "julho 2025"/"2019" viram filtro de data)
- [x] **Álbuns:** manuais (criar, renomear, excluir, adicionar/remover em lote, capa automática ou escolhida) e inteligentes (criados a partir dos filtros com "Salvar como álbum"; "Editar regra" reabre os filtros com a regra carregada)
- [x] Menus ainda não implementados (Viagens, Pessoas, Organizar) com estado vazio explicativo (desde a Fase 1)
- [ ] Alternância grade/lista da topbar: não implementada (a grade cobre os fluxos do mockup; lista fica para quando houver colunas úteis, como qualidade, na Fase 4)

**Aceite:** navegar 50 mil fotos a 60 fps, busca em menos de 100 ms, todos os fluxos do mockup desktop (exceto os dados de análise) funcionando.

**Medições (2026-09-28, catálogo sintético de 50 mil itens):**
- Consultas no core (`query_bench`, release): primeira página 1,5–6 ms em qualquer ordenação; contagem 2–8 ms; contexto do visualizador 1–25 ms; busca FTS 3–9 ms; resumo da Início 48 ms. Antes dos índices de expressão, as ordenações não padrão levavam 50–110 ms (e o contexto 250 ms).
- App (`tauri dev`, WebKitGTK em Xephyr, renderização por software): rolagem contínua por 5 s com **mediana de 17 ms e p95 de 20 ms por quadro** (60 fps), ~90 tiles no DOM; busca de ponta a ponta (tecla → tiles) **28–79 ms**; salto da timeline para o ano mais antigo 4,3 s (carrega quase toda a biblioteca em páginas de 500).

**Validação no app:** ✅ catálogo v0.4 migrado (FTS populado pela migration); todos os fluxos acima executados pela UI.
**Bugs encontrados e corrigidos na validação:**
- Favoritar duas fotos seguidas atualizava só a segunda na tela: o barramento de atualizações era um signal ("último valor") e perdia publicações anteriores à detecção de mudanças. Virou um log numerado com `subscribe` (teste `media-bus.spec`).
- Voltar do visualizador levava a galeria ao topo: agora itens e rolagem são restaurados (`GalleryCache`).
- O cabeçalho do último dia carregado mostrava contagem parcial: agora é omitida até a página seguinte chegar.

**Achados:**
- O salto para anos muito antigos em bibliotecas grandes carrega as páginas intermediárias (4,3 s com 50 mil itens). Se incomodar, a próxima etapa é paginar a partir de uma data (cursor sintético) sem carregar o meio.
- A contagem por dia nos cabeçalhos da timeline só é exata para dias já carregados por inteiro.

---

### Fase 4 — Análise (≈ 3 semanas) → `v0.7` ✅ implementada (branch `fase-4-analise`)

- [x] Qualidade (estágio `analyze`, sobre o preview de 1024): nitidez local (p90, em 8×8 blocos com textura, da variância do Laplaciano normalizada pela variância de luminância), histograma (média, p99, % estourada), entropia/contraste (vazia), resolução; `level` e flags (`blurry`, `dark`, `overexposed`, `low_res`, `empty`). Screenshots não recebem nível
- [x] Similaridade: pHash DCT + mediana (calculado no `analyze`), BK-tree, grupos `exact_duplicate` (SHA-256) / `visual_duplicate` (≤ 4) / `similar` (≤ 12, até 30 min, e < 1 km quando há GPS) e melhor candidata (resolução → nitidez → exposição → favorita → arquivo mais antigo). Hashes degenerados e imagens vazias ficam de fora
- [x] Sequências: mesma câmera, ≤ 3 s entre fotos consecutivas, ≥ 3 fotos **e** consecutivas visualmente semelhantes (evita "rajadas" de câmeras com relógio desconfigurado)
- [x] Classificação multidimensional: rótulos automáticos com score (`category:screenshot`, `category:whatsapp`, `momentary:document`, `momentary:accidental`) e tags manuais (painel, visualizador, filtro `tag`, busca); FTS recriado com coluna `labels` ("captura de tela", "documento"…)
- [x] Screenshots (nome, pasta, tamanho de tela sem EXIF de câmera + interface/formato sem perda) e momentâneas (documento: papel claro, sem cor, muitas bordas de texto; acidental: câmera + quase preta ou borrada demais) com score
- [x] Execução incremental: estágio global só para bibliotecas "sujas" (`analysis_state`), quando as filas esvaziam; recalcula flags, rótulos e grupos a partir das métricas guardadas
- [x] Limiares ajustáveis em Configurações ("Limiares da organização", com restaurar padrões); mudar um valor recalcula em segundos, sem reler fotos
- [x] Conjunto rotulado: `tests/labeled/generate.py` (190 imagens a partir de 20 fotos reais + screenshots e documentos sintéticos) e `examples/analysis_eval.rs` (precisão/recall)
- [x] Interface: badges no menu Organizar; telas Possíveis duplicatas (Exatas/Visuais) e Fotos semelhantes (Semelhantes/Sequências) em cards com a melhor candidata, "Selecionar as outras" e visualizador navegando dentro do grupo; Baixa qualidade, Fotos momentâneas e Screenshots como galerias com subfiltros; bloco "Classificação" + tags no painel e no visualizador; "Agrupando…" no indicador
- [ ] Foto de tela (moiré/retângulo luminoso) e "acidental por inclinação/exposição em sequência" (PRD 14): ficam para a IA local (Fase 7)

**Aceite:** contadores de Organizar preenchidos; com o conjunto rotulado, duplicata exata atinge 100 %, duplicata visual ≥ 95 % de precisão e screenshots ≥ 90 % de precisão. ✅

**Resultado no conjunto rotulado (2026-09-28, `analysis_eval`, limiares padrão):**

| Heurística | Precisão | Recall | Observação |
|---|---|---|---|
| Duplicata exata | 100 % | 100 % | |
| Duplicata visual | 96 % | 80 % | perdas: recortes de 3 % nas bordas; com distância 6 o recall vai a 90 %, mas a precisão cai para 87 % |
| Screenshot | 100 % | 100 % | 5 papéis de parede sem EXIF no tamanho de tela como negativos difíceis |
| Borrada | 71 % | 80 % | falsos positivos são fundos em bokeh e céus/nuvens suaves (ambíguos) |
| Escura | 100 % | 100 % | subexposta = escura **e** sem altas luzes (cenas noturnas não entram) |
| Documento | 100 % | 100 % | documentos sintéticos; validar com fotos reais de recibos |

**Como a calibração foi feita:** a primeira medição tinha screenshot com 85 % de precisão (papéis de parede), borrada com 43 %, escura com 53 % e documento com 71 %. As métricas foram medidas por categoria antes de mudar as regras.
- **pHash:** o hash de gradiente e o DCT + média degeneravam em imagens lisas, agrupando fotos escuras sem relação. Em 40 fotos reais, o DCT + mediana separou melhor as fotos diferentes (5º percentil de distância 24, contra 17 do gradiente), com cópias reduzidas e recomprimidas a no máximo 4.
- **Nitidez:** a variância global do Laplaciano penalizava céus e fotos escuras; a versão local normalizada é independente da exposição.

**Validação no app:** ✅ catálogo v0.5 migrado e analisado (464 itens em ~2 s); conjunto rotulado como biblioteca (190 itens analisados em 25 s pela UI); badges, as 5 telas, painel com qualidade/grupos/tags, mudança de limiar pela UI recalculando sem reprocessar (Baixa qualidade 50 → 36).
**Bugs encontrados e corrigidos:** hash degenerado agrupando fotos lisas/escuras sem relação; screenshots marcados como "estourados"; câmera com relógio desconfigurado gerando "sequência" de 37 fotos diferentes; favoritar só reagrupava na verificação ociosa seguinte (até 30 s).

**Achados / limites:**
- O conjunto rotulado usa papéis de parede e imagens sintéticas; os números devem ser revalidados com fotos pessoais reais (celular) antes da v1.0, principalmente borrada e documento.
- A duplicata visual é sensível a recortes: uma foto recortada em mais de ~3 % por lado aparece como "semelhante" (se estiver no intervalo de tempo), não como duplicata.

---

### Fase 5 — Revisão e Lixeira (≈ 2 semanas) → `v1.0` ✅ implementada (branch `fase-5-revisao`)

- [x] **Correção da Fase 4 (teste no Windows 11):** duas camisas de mesmo formato, uma azul e outra cinza, apareciam como duplicata visual. O pHash só vê luminância. Agora cada foto guarda uma **assinatura de cor** (croma OKLab médio numa grade 8×8, `metrics::color_layout`) e duplicata visual exige também `color_distance ≤ 2` (ajustável em Configurações). A mesma forma em outra cor passa a ser "semelhante" (informativo), não duplicata
- [x] **Correção da Fase 4 (teste no Windows 11):** fotos de pessoas e objetos eram classificadas como documento (a regra só olhava claro + sem cor + contraste + bordas). Agora documento exige **linhas de texto** (`metrics::text_lines`: perfil de tinta por projeção, com correção de inclinação de ±4° e nas duas orientações; ≥ 8 linhas). Capturas de tela com texto não viram documento
- [x] Motor de sugestões (`review`): `review_candidates` por motivo, reconstruído no estágio global a partir de grupos, flags, rótulos e exemplos; score por motivo (gravidade além do limiar) e **prioridade** combinada com pesos por motivo (`1 − Π(1 − peso·score)`, em `media.review_priority`, com índice); regras R4/R5: favoritas nunca são candidatas (na hora, ao favoritar), a melhor candidata de um grupo nunca é candidata dele, "Manter"/"Ignorar" não voltam a ser sugeridos pelo mesmo motivo
- [x] **Exemplos** (pedido do teste no Windows): o usuário dá fotos (da biblioteca, pelo ✨, ou arquivos do disco em Configurações → Exemplos) como exemplo do que remover ou do que manter; fotos parecidas com um exemplo "remover" (e não mais parecidas com um "manter") ganham o motivo `EXAMPLE`. Sem IA ainda: o `descriptor` compara o aspecto (tom, cor, textura, composição, se é captura/câmera/formato); o `EmbeddingAnalyzer` da Fase 7 entra atrás das mesmas funções
- [x] Tela **Revisão** (galeria por prioridade, filtro por motivo com contagens, motivo em cada miniatura, Manter/Ignorar/Lixeira/Exemplo em lote, aba **Histórico** com Desfazer/Restaurar); ações também no painel, no visualizador (Delete) e nas telas de duplicatas ("Enviar as outras para a lixeira")
- [x] Lixeira: `rename` para `<biblioteca>/.photovault-trash/<data>/<caminho>` (a linha da mídia acompanha o arquivo, então o scanner nunca o vê como ausente e o `pv://` continua servindo); restaurar ao caminho original, com conflito tratado ("(restaurada)" no nome, com confirmação); excluir definitivamente (confirmação dupla); esvaziar; limpeza automática opcional (desligada); opção de lixeira do SO (crate `trash`)
- [x] `operations_log` para toda operação física (pendente → concluída/falha/revertida), com `trash::recover` na inicialização para operações interrompidas
- [x] Confirmação antes de qualquer operação física; lote acima de 500 itens pede o número digitado (PRD §25)
- [x] Teste de segurança (`jobs::tests::review_and_trash`): SHA-256 igual após enviar e restaurar, conflito sem tocar no arquivo novo, nada vai para a lixeira duas vezes, só itens da lixeira podem ser excluídos, log completo, recuperação após queda

**Aceite:** o usuário revisa as sugestões, envia para a lixeira e restaura sem perda. ✅ (validado no app: revisão → lixeira → restauração com hash idêntico; Delete no visualizador; exemplo pelo painel achando os 12 documentos). **Release 1.0 portátil (Windows + Linux).**

**Resultado no conjunto rotulado (2026-09-28, `analysis_eval`, 233 imagens, limiares padrão):**

| Heurística | Precisão | Recall | Observação |
|---|---|---|---|
| Duplicata exata | 100 % | 100 % | |
| Duplicata visual | 100 % | 80 % | **sem a verificação de cor: 52 %** (22 falsos positivos entre camisas de cores diferentes e fotos com um objeto recolorido) |
| Screenshot | 100 % | 100 % | |
| Borrada | 71 % | 80 % | sem mudança |
| Escura | 100 % | 100 % | |
| Documento | 100 % | 92 % | **regra antiga: 80 %** com os novos negativos (fotos P&B claras); 0 falsos positivos em 464 fotos reais de banco de imagens (antes: 2 objetos sobre fundo branco) |

Exemplos (2 fotos da categoria como exemplo "remover", limiar 0,70):

| Categoria | Precisão | Recall | Observação |
|---|---|---|---|
| Documentos | 100 % | 100 % | |
| Camisas (produto) | 100 % | 100 % | |
| Escuras | 100 % | 75 % | |
| Screenshots | 100 % | 5 % | a categoria mistura tema claro/escuro e celular/desktop: 2 exemplos não cobrem; o exemplo acha fotos com o mesmo **aspecto**, e screenshots já têm detector próprio |

**Como foi calibrado:**
- **Cor:** distância das cópias (reduzida, recomprimida, recortada, clareada) ≤ 1,5; camisas iguais em outra cor 13–27; fotos reais com um objeto recolorido 3,2–10. Limiar 2.
- **Linhas de texto:** a contagem por faixas fixas falhava em páginas inclinadas e gerava ruído em fotos com textura (até 141 "linhas"); a projeção com correção de inclinação separa documentos (18–74 na maioria) de fotos (≤ 5) e P&B (≤ 2).
- **Exemplos:** varredura do limiar de 0,5 a 0,8; 0,7 é o menor sem falsos positivos em nenhum cenário.

**Bugs encontrados e corrigidos:** o que o teste no Windows mostrou (camisas como duplicata, pessoas/objetos como documento); screenshots cheios de texto passariam a "documento" com a regra nova.

**Achados / limites:**
- O custo da análise por foto subiu de ~15 para ~25 ms (linhas de texto: 18 projeções); 100 mil fotos ≈ 10 min em 4 núcleos, só na primeira vez.
- Os exemplos não entendem conteúdo ("comida", "carros") até a Fase 7; funcionam para "fotos com esta cara" (recibos, prints de um app, fotos no escuro, fotos de produto).
- Vídeos ainda não geram sugestões (duplicatas exatas de vídeo seriam úteis: ficam para depois do ffmpeg).
- Com a lixeira do sistema, a restauração é feita pela lixeira do Windows/Linux; o arquivo restaurado volta como item novo no próximo scan.

---

### Fase 6 — Viagens e eventos (≈ 2 semanas) → `v1.1` ✅ implementada (branch `fase-6-viagens`)

- [x] Detecção (`events::detect`, pura): trechos separados por lacunas de mais de 6 h; "casa" = célula GPS de ~20 km fotografada em mais dias; trecho *longe* quando a mediana das fotos com GPS está a mais de 50 km de casa; trechos longe próximos no tempo (≤ 48 h, as noites) formam uma viagem, e trechos sem GPS no meio dela entram; viagem = ao menos 2 dias; um dia longe = evento (passeio); outros trechos com ≥ 20 itens = eventos. Só datas reais (fotos datadas pelo `mtime` ficam de fora). Limiares em Configurações → Viagens e eventos
- [x] Títulos pelos lugares ("Viagem para Gramado e Canela", "Evento em Porto Alegre", "Evento de 12 de julho de 2025" sem GPS) e resumo de lugares
- [x] Decisões: `suggested` (refeitas a cada passada, com o id mantido quando as mesmas fotos voltam), `accepted` (fotos novas desses dias entram sozinhas), `edited` (título, período ou fotos alterados: congelada), `ignored` (não volta: sugestão com ≥ 50 % das fotos de um evento ignorado não é refeita; "Restaurar" desfaz). Fotos de eventos aceitos/editados não geram novas sugestões
- [x] Tela Viagens (sugestões com Aceitar/Ignorar, Suas viagens, Eventos, Ignorados) e tela do evento em tema escuro: título editável, período, contagens, distância de casa, carrossel de destaques (melhores fotos, uma por grupo/rajada), cards por dia com o dia selecionado destacado, abas Fotos · Linha do tempo · Informações (Mapa e Pessoas "em breve"), Editar período, Remover do evento, Criar álbum
- [x] Card e seção de Viagens no Início; evento da foto no painel/visualizador; filtro `eventId` na consulta única (galeria, visualizador, álbum inteligente)
- [x] Álbuns inteligentes sugeridos: viagens aceitas, "Favoritas de 2025", "Melhores de 2025", "Screenshots", "Para revisar" (só com ≥ 5 itens e sem álbum com a mesma regra)
- [x] **Geocodificação trocada:** a tabela do crate `reverse_geocoder` não tinha Gramado nem Tramandaí e vinha sem acentos ("Tramandai", "Bage"). Agora é o GeoNames `cities1000` oficial (161 mil lugares, com acentos, sem bairros/arrondissements), embutido (`data/cities.tsv.gz`, 3 MB, gerado por `data/build_cities.py`) e escolhido pela população em relação à distância (um distrito ao lado de uma cidade não a substitui; uma cidade pequena onde a foto foi tirada não perde para a capital a 15 km). Catálogos antigos são regeocodificados uma vez (`geo::refresh_places`, ~0,25 s)

**Aceite:** com a biblioteca de teste (`tests/labeled/trips.py`: casa em Porto Alegre, 3 dias em Gramado/Canela, festa em casa, 4 dias em Buenos Aires com um dia sem GPS, dia na praia), aparecem exatamente 2 viagens ("Viagem para Gramado e Canela", 90 fotos, a 80 km; "Viagem para Buenos Aires", 80 fotos, a 842 km) e 2 eventos ("Evento em Porto Alegre", "Evento em Tramandaí e Imbé"). ✅

**Validação no app:** ✅ catálogo v0.7 migrado (0005 + 0006) e regeocodificado (a foto do fixture perto de Gramado passou de "Canela" para "Gramado"); biblioteca de viagens escaneada e analisada; aceitar, editar título, filtro por dia, destaques, Início com viagens, álbum criado a partir da sugestão (90 itens).

**Achados / limites:**
- "Casa" é um só lugar: quem mora em duas cidades verá as idas à segunda como viagens (basta ignorar; não voltam).
- O título usa os dois lugares mais fotografados; lugares vizinhos (Tramandaí e Imbé) podem aparecer juntos.
- Sem GPS não há viagens, só eventos (sequências densas de fotos).
- Mapa e Pessoas ficam para a Fase 7; a busca por texto ainda não encontra o título do evento (encontra os lugares).

---

### Fase 6.1 — Ajustes do teste no Windows → `v1.2` ✅ concluída (branch `fase-6.1-ajustes`)

- [x] **Bug:** um trecho sem lacuna de 6 h que começa em casa e segue longe (festa à noite, estrada de madrugada) era decidido inteiro pela mediana: ou virava um "evento em casa" com as fotos da viagem, ou a viagem engolia a festa. Agora o trecho também é cortado onde as fotos cruzam a linha de `trip_min_km` (`detect::place_cuts`), na maior lacuna entre o último GPS de um lado e o primeiro do outro; menos de 3 fotos seguidas do outro lado são ruído (posição antiga) e não cortam. Aceite do `trips.py` inalterado (2 viagens, 2 eventos)
- [x] Trocar o tipo (viagem ⇄ evento) na tela do evento (`EventUpdate.kind`): congela o evento; o título automático acompanha ("Evento em Gramado" → "Viagem para Gramado"), um título do usuário fica
- [x] Reclassificar agora (Configurações → Viagens e eventos, `events::reclassify`): refaz as sugestões e mostra quantas viagens/eventos saíram; opções "refazer também os aceitos" (os que voltam mantêm id e ficam aceitos; os outros saem) e "sugerir de novo os ignorados". Editados nunca mudam
- [x] Sua casa (`EventSettings.homes`, até 5): confirmar a detectada pelas fotos ("Pelas fotos, sua casa parece ser…"), escolher outra cidade pela base do GeoNames embutida (`geo::search`, sem acento, por população) e ter mais de uma casa; distâncias até a casa mais próxima. Sem casa definida vale a detectada, como antes
- [x] Miniatura de vídeo por captura de quadro no WebView, sem ffmpeg (`ingestion::frames`, `VideoFrameService`): o vídeo é aberto escondido, o quadro de 1 s (ou 10 % da duração) vai para um canvas e o JPEG vira as miniaturas 256/1024 como nas fotos; o `pv:` responde com CORS para o canvas poder ser lido. Vídeo que o WebView não toca (codec) fica com `frame_error` (migration 0007) e o ícone; "Reprocessar" tenta de novo. O visualizador usa a miniatura como `poster`
- [x] **Validação no app no Windows** ✅ (captura de quadro, Sua casa, Reclassificar, trocar tipo). No Linux desta máquina o WebKitGTK não renderizava nem uma página `data:` trivial (problema do ambiente, não do app): repetir quando o ambiente voltar
- [x] **Juntar eventos** (achado do teste no Windows: uma viagem sem GPS vira um evento por dia). Em Viagens, "Juntar eventos" → marcar os cards → escolher Viagem/Evento, o lugar (opcional, busca na base de cidades embutida) e o título (`events::merge`). O resultado leva as fotos dos eventos e as fotos livres entre eles (noites, dias com poucas fotos; não as de outro evento aceito/editado), fica `edited`, e sugestões que ficaram dentro dele somem. Sem título: "Viagem para Salvador" pelo lugar escolhido, senão pelos lugares das fotos ou pela data
- [x] Aceitar uma sugestão continua na tela de Viagens; o aviso diz para onde o card foi ("Movida para Suas viagens")

**Limites:** um vídeo modificado mantém o quadro antigo (a miniatura só é capturada quando ainda não existe).

### Fase 7a — IA local: conteúdo e busca (≈ 2 semanas) → `v1.3` ✅ implementada (branch `fase-7a-ia`)

- [x] **Modelos** (`ai`): CLIP ViT-B/32 (imagem, OpenAI, MIT; ONNX int8 do Xenova, 89 MB) + `clip-ViT-B-32-multilingual-v1` (texto, Apache 2.0; ONNX int8, 135 MB) + projeção 768→512 (`2_Dense`) + tokenizador: 228 MB. Um modelo só serve à busca e às cenas. URLs fixadas num commit de cada repositório do Hugging Face e SHA-256 conferido (`ai::MANIFEST`)
- [x] **Download com consentimento** (`ai::download`): Configurações → IA local explica o que é baixado, de onde e as licenças; é o único acesso à rede do app e só acontece no clique. `.part` + SHA-256 + tamanho, depois `rename`; cancelável; arquivos já corretos são mantidos. Medido: 228 MB em 20 s
- [x] **Runtime**: `ort` 2.0.0-rc.13 (ONNX Runtime 1.28), CPU, **ligado estaticamente** (sem DLL). Binários baixados no build via rustls (`ort-sys/tls-rustls`: o build não precisa de OpenSSL); `tokenizers` com `fancy-regex` (sem código C). Executável release Linux: 77 MB (não medi o anterior)
- [x] **Análise de conteúdo** (`JobRunner::step_embed`): quarta etapa da fila, depois de tudo; lê a prévia de 1024 px, lotes de 16, threads = padrão do ONNX Runtime (um por núcleo físico) ou o valor manual de "CPU". Vetor em int8 + escala (516 bytes por foto, `media_embeddings`, migration 0008) com a `thumb_version` de origem: prévia nova (arquivo editado, quadro de vídeo) = foto de volta na fila. Falha do modelo desliga a IA na sessão em vez de repetir; prévia ilegível fica registrada e não é repetida
- [x] **Busca por conteúdo** na busca de sempre (Ctrl+K): o texto sem as datas vira "uma foto de …" e casa com as fotos acima de 0,24 de semelhança e a até 0,05 da melhor; resultado = nome/pasta/local/álbum **ou** conteúdo, na ordem escolhida (data), combinável com os filtros ("gato 2024"). Índice da biblioteca em memória (invalidado a cada gravação) e cache das últimas 16 buscas
- [x] **Cenas** ("Praia 71 %", 26 cenas): derivadas na leitura do embedding (softmax com escala 100; ≥ 20 % e semelhança ≥ 0,2; até 3). Mudar a lista não exige reprocessar. Não vão para `media_labels` (a análise apaga os rótulos `auto` ao reanalisar)
- [x] **Interface**: bloco IA local (baixar, progresso, cancelar, usar/desligar, remover), etiquetas de cena no painel e no visualizador, "Analisando o conteúdo · N fotos" no indicador da fila, placeholder da busca
- [x] **Medição** (`tests/labeled/content.py`: 144 fotos livres do Wikimedia Commons em 12 categorias + 20 paisagens de distração; `examples/ai_eval.rs`): precisão 71 %, recall 87,5 % com os limiares escolhidos (a precisão é subestimada: "praia" ao pôr do sol e as paisagens de distração contam como erro). "uma foto de …" subiu o recall de 78 % para 84 % ("carro" 3 → 8 de 12). Cena esperada entre as etiquetas em 87 % das fotos (125/144), primeira em 80 %. Modelo int8 ≈ fp32 em qualidade e mais rápido (25 × 35 ms no protótipo)
- [x] Teste de ponta a ponta com o modelo real, `#[ignore]` (`content_search_end_to_end`: scan → análise → embeddings → busca → cenas)

**Desempenho** (i7-1255U, notebook): ~35–45 ms por foto (o modelo; a prévia já existe) → ~1 h para 100 mil fotos, só na primeira vez. Memória com o modelo carregado: ~590 MB de pico. Buscar: embedding do texto ~10 ms + varredura do índice.

**Validação (2026-09-30):** teste inicial no Windows 11 ok. **Pendentes do teste:** (1) o **build no Linux falhou** (a investigar no fim da 7b); (2) **buscar "praia" não trouxe as fotos certas**: medir com fotos reais de praia (limiares `MIN_SIMILARITY`/`MAX_BELOW_BEST` e a frase "uma foto de …"), antes de mudar.

**Limites:** as cenas não alimentam as heurísticas de momentâneas (fica para depois de medir); "bebê"/"piscina", que não existem no conjunto, ainda trazem 2–4 resultados; busca por conteúdo em vídeos usa só o quadro capturado.

### Fase 7b — Pessoas (≈ 2 semanas) → `v2.0` ✅ implementada (branch `fase-7b-pessoas`)

- [x] **Modelos** (pacote próprio, `ai::FACES`, 39 MB, consentimento separado da busca por conteúdo): YuNet 2023mar (detecção + 5 pontos, MIT, 0,2 MB) e SFace 2021dec (vetor de 128 dimensões, Apache 2.0, 38,7 MB), do OpenCV Zoo no Hugging Face, fixados por commit e SHA-256. Licenças conferidas nos arquivos `LICENSE` dos repositórios. Os do InsightFace ficaram de fora (só pesquisa). `ai::Package` generaliza o manifesto: cada pacote tem pasta, download e remoção próprios; quem já tinha baixado os 228 MB da 7a não baixa de novo
- [x] **Inferência** (`ai::faces`): pré e pós-processamento do `FaceDetectorYN`/`alignCrop` do OpenCV (imagem encaixada em 640 × 640, BGR 0–255; células por escala 8/16/32, NMS 0,3; alinhamento por semelhança nos 5 pontos para 112 × 112). 13 ms para detectar + 19 ms por rosto (i7-1255U)
- [x] **Fila** (`JobRunner::step_faces`): quinta etapa, depois do conteúdo; lê a prévia de 1024 px; `face_scans` guarda modelo e `thumb_version` (prévia nova = foto de volta na fila; rosto no mesmo lugar mantém a pessoa e a confirmação). Quando a fila esvazia e algo mudou (`people_state.dirty`), reagrupa
- [x] **Agrupamento** (`people::cluster`, função pura): rostos confirmados são âncoras (média dos 3 mais parecidos ≥ 0,50 atrai os outros); o resto por "leader" (centróide ≥ 0,55) + fusão de centróides ≥ 0,60; grupo com 3 rostos ou mais vira pessoa sugerida. Ids estáveis entre reagrupamentos (maior sobreposição). Só entram rostos com ≥ 40 px, de frente (≥ 0,3) e detecção ≥ 0,8
- [x] **Decisões** (`people`): nomear confirma o grupo; mesmo nome = mesma pessoa (junta); "Não é esta pessoa" (`face_rejections`, vale também para grupos sugeridos); "Quem é?" num rosto da foto; juntar; ocultar (confirma os rostos, então fotos novas dela ficam ocultas também); foto de capa. Pessoas globais, listas por biblioteca. Remover os modelos apaga rostos, pessoas e nomes
- [x] **Busca e filtro:** `MediaFilter.person_id` (tela da pessoa, visualizador) e nomes na busca de sempre (`people_hits` no `resolve`, ao lado do FTS e do conteúdo; "ana" acha "Ana Souza", sem acento/maiúscula)
- [x] **Interface:** Pessoas (nomeadas, "Sem nome", ocultas, juntar por seleção), tela da pessoa (nome editável com sugestões, fotos, "Revisar rostos" com "Não é …" em lote e "Usar como foto", "Juntar com…", ocultar), "Pessoas" no painel de informações e no visualizador (nome, "Quem é?", "Não é …"), seção no bloco IA local, "Procurando rostos · N fotos" no indicador da fila, rosto recortado por `pv://…/face/<id>`
- [x] **Medição** (`examples/face_eval.rs` no LFW: 158 pessoas com 10–30 fotos + 600 desconhecidos, 3.574 rostos): detecção 100 %; pares ≥ 0,45: 98,2 % da mesma pessoa reconhecidos, 0,008 % de falsos. Agrupamento com os limiares escolhidos: 158 grupos para 158 pessoas, **nenhum misturado**, precisão de pares 99,9 %, recall 98,5 % (fusão 0,50 misturava 3 grupos). Com 2 rostos confirmados por pessoa, 97 % dos outros vão para a pessoa certa e 0,5 % para a errada. Rostos pequenos (LFW reduzido numa tela de 1024 × 768): 49 px → precisão 99,8 %, recall 95 %; 38 px → 99,8 % / 92 %; 29 px → 1 grupo misturado e 74 desconhecidos em grupos (por isso o mínimo de 40 px)
- [x] **Desempenho do agrupamento** (`examples/people_bench.rs`): 36 mil rostos (500 pessoas + 16 mil desconhecidos) em 7,7 s, em segundo plano; as decisões do usuário gravam na hora
- [x] Testes: `people::tests` (grupos, ids estáveis, nome, busca, correções, juntar, ocultar, prévia nova, remoção) e `people_end_to_end` (`#[ignore]`, modelos reais + LFW: 3 pessoas sem mistura, desconhecido fora, busca pelo nome, recorte)
- [ ] **Olhos fechados** na escolha da melhor candidata: fica para depois. Os 5 pontos do YuNet não dizem se o olho está aberto, e não encontrei um modelo pequeno com licença livre em ONNX; medir antes de escolher
- [ ] **Exemplos da Fase 5 com embeddings do CLIP:** adiado para junto da busca por foto de exemplo (abaixo), que usa a mesma comparação

**Limites:** o LFW é de adultos, de frente e em fotos de imprensa; fotos de família (crianças crescendo, perfil, grupos com rostos pequenos) vão separar mais a mesma pessoa em grupos (resolve-se juntando ou dando o mesmo nome). Rostos com menos de 40 px na prévia aparecem na foto, mas não são agrupados. Uma pessoa só aparece com 3 fotos ou mais.

**Pendente:** validação no app (Windows) e o build no Linux (pendência da 7a).

**Ideias para amadurecer mais para o fim** (trazidas pelo usuário em 2026-09-30):

- **Busca por uma foto de exemplo:** "fotos parecidas com esta", pelo conteúdo (CLIP, imagem × imagem). Os vetores já existem desde a 7a; junta com os exemplos da Fase 5 usando o CLIP
- **Álbuns lógicos por pessoa:** álbum inteligente com a regra `personId` (o filtro já existe; falta a interface)
- **"Somente ela":** fotos em que a pessoa aparece sozinha (ou só com certas pessoas), e combinações ("Ana e Bruno"); decidir se "Ana praia" deve ser E (hoje a busca junta nome **ou** conteúdo)

### Fase 8 — Organização física (≈ 2 semanas) → `v2.1`

- [ ] Mover, renomear e reorganizar por regra (ex.: `Ano/Evento/`), com preview ANTES/DEPOIS, confirmação, log, rollback e retomada após desconexão

### Fase 9 — Android (≈ 6 semanas) → `v3.0`

- [ ] `tauri android init`; `core::paths` para Android; features `heic`/`video-thumbs` substituídas por APIs nativas
- [ ] Plugin Kotlin `AndroidMediaStoreSource` (MediaStore + permissões `READ_MEDIA_*`) implementando `MediaSource`; `relative_path` vira `source_uri`
- [ ] Layout mobile do mockup (bottom nav, grade Organizar)
- [ ] Futuro: sincronização ou análise do celular conectado ao desktop

---

## 4. Cronograma resumido

| Fase | Duração | Acumulado | Release |
|------|---------|-----------|---------|
| 0 Estabilização | 3 d | 0,5 sem | v0.2 |
| 1 Fundação | 2 sem | 2,5 sem | v0.3 |
| 2 Ingestão | 2,5 sem | 5 sem | v0.4 |
| 3 Catálogo | 3 sem | 8 sem | **v0.5 (utilizável)** |
| 4 Análise | 3 sem | 11 sem | v0.7 |
| 5 Revisão/Lixeira | 2 sem | 13 sem | **v1.0** |
| 6 Eventos | 2 sem | 15 sem | v1.1 |
| 7 IA | 4 sem | 19 sem | v2.0 |
| 8 Org. física | 2 sem | 21 sem | v2.1 |
| 9 Android | 6 sem | 27 sem | v3.0 |

---

## 5. Riscos

| Risco | Mitigação |
|-------|-----------|
| HEIC exige a libheif nativa (portabilidade, licença LGPL) | feature flag, lib dinâmica empacotada ao lado do exe; sem ela, o HEIC entra só no catálogo |
| Miniatura de vídeo exige ffmpeg (tamanho ~80 MB, LGPL) | sidecar opcional, baixado sob demanda |
| WebKitGTK tem desempenho inferior ao WebView2 em grades grandes | virtualização agressiva, `content-visibility`, medir cedo (fase 1) |
| AppImage e glibc antigas | build em `ubuntu-22.04` |
| SQLite em HD externo desconectado durante a escrita | WAL + checkpoint ao fechar; o catálogo fica na pasta do app; aviso ao detectar o volume ausente |
| Heurísticas de momentâneas com muitos falsos positivos | só sugerem (nunca agem), limiares ajustáveis, conjunto rotulado para calibrar |
| Optimus UI v2 é recente (bugs, ex.: `p-card` ignora `max-width`) | encapsular em componentes `shared/` para trocar ou corrigir num único ponto |

---

## 6. Próximo passo imediato

1. Validar a v2.0 no Windows 11: baixar os modelos de rostos em Configurações → IA local, ver os grupos em Pessoas, dar nomes, juntar, "Não é …", e buscar pelo nome.
2. Investigar o build no Linux que falhou e a busca por "praia" (pendências da 7a).
3. Decidir o empacotamento da libheif (HEIC) e do ffmpeg, pendentes da Fase 2.
4. Amadurecer as ideias da 7b (foto de exemplo, álbuns por pessoa, "somente ela") ou seguir para a **Fase 8**.
