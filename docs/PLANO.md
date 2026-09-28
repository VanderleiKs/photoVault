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

### Fase 3 — Catálogo e navegação (≈ 3 semanas) → `v0.5` (primeira versão útil para o usuário)

- [ ] **Início:** hero, cards de estatística, carrossel de anos, fotos recentes (slider de tamanho, ordenação)
- [ ] **Todas as fotos:** grade virtualizada com keyset pagination, seleção múltipla, favorito na miniatura, duração do vídeo
- [ ] **Painel de informações:** metadados, chips, local
- [ ] **Visualizador:** imagem 1024 e original no zoom, contador "n / total" no contexto atual, tira de miniaturas, teclado, player de vídeo, painel de Detalhes
- [ ] **Timeline:** Ano → Mês → Dia, scrubber de anos
- [ ] **Favoritos:** toggle em todos os lugares, filtro e tela
- [ ] **Filtros combinados** (chips, persistência por biblioteca) e **busca Ctrl+K** com FTS5
- [ ] **Álbuns:** manuais (CRUD, adicionar e remover fotos, capa) e inteligentes (editor de regra reusando os filtros)
- [ ] Menus ainda não implementados (Viagens, Pessoas, Organizar) com estado vazio explicativo, sem links quebrados

**Aceite:** navegar 50 mil fotos a 60 fps, busca em menos de 100 ms, todos os fluxos do mockup desktop (exceto os dados de análise) funcionando.

---

### Fase 4 — Análise (≈ 3 semanas) → `v0.7`

- [ ] Qualidade: Laplaciano, histograma, resolução, imagem vazia, `level`, flags
- [ ] Similaridade: BK-tree sobre o pHash, grupos `exact_duplicate` / `visual_duplicate` / `similar`, melhor candidata
- [ ] Sequências: agrupamento temporal por câmera, melhor candidata (nitidez, exposição)
- [ ] Classificação multidimensional: labels automáticas e manuais, tags
- [ ] Screenshots e fotos momentâneas (heurísticas do PRD 14) com score
- [ ] Execução incremental dos estágios globais
- [ ] Limiares ajustáveis em Configurações
- [ ] Testes com um conjunto rotulado (~200 imagens) para medir precisão e recall de cada heurística

**Aceite:** contadores de Organizar preenchidos; com o conjunto rotulado, duplicata exata atinge 100 %, duplicata visual ≥ 95 % de precisão e screenshots ≥ 90 % de precisão.

---

### Fase 5 — Revisão e Lixeira (≈ 2 semanas) → `v1.0`

- [ ] Motor de sugestões: `review_candidates` por motivo, score de retenção, regras R4/R5 (favoritas e "manter" protegidas)
- [ ] Telas Organizar (duplicatas, semelhantes, baixa qualidade, momentâneas, screenshots) e Revisão (priorizada), com ações por foto, grupo e lote
- [ ] Lixeira: enviar (rename para `.photovault-trash`), restaurar (com conflito tratado), excluir definitivamente (confirmação dupla), esvaziar, opção de lixeira do SO
- [ ] `operations_log` para toda operação física
- [ ] Histórico de revisão
- [ ] Teste de segurança: nenhuma ação sem confirmação e restauração 100 % fiel (hash igual)

**Aceite:** o usuário revisa as sugestões, envia para a lixeira e restaura sem perda. **Release 1.0 portátil (Windows + Linux).**

---

### Fase 6 — Viagens e eventos (≈ 2 semanas) → `v1.1`

- [ ] Detecção de eventos (lacunas temporais + GPS) e de viagens (distância do local base)
- [ ] Títulos sugeridos a partir dos lugares
- [ ] Aceitar, editar ou ignorar, sem sugerir de novo o que foi ignorado
- [ ] Tela Viagens (lista) e tela do evento (abas, carrossel, cards por dia), conforme o mockup
- [ ] Card de Viagens na home; álbuns inteligentes sugeridos

### Fase 7 — IA local (≈ 4 semanas) → `v2.0`

- [ ] `ort` + download de modelos sob demanda com consentimento
- [ ] `SceneAnalyzer` (chips "Paisagem 0.92"), com as labels de cena alimentando as heurísticas de momentâneas
- [ ] `FaceAnalyzer`: detecção, depois agrupamento, depois nomeação; tela Pessoas; olhos fechados na escolha da melhor candidata
- [ ] `EmbeddingAnalyzer` (CLIP) + busca semântica

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

1. Validar as Fases 0–2 no Windows 11 (zip do `release.yml` ou `npx tauri build --no-bundle && npm run package:portable`), incluindo um HD USB real para o aceite de 50 mil arquivos.
2. Decidir o empacotamento da libheif (HEIC) e do ffmpeg (miniaturas de vídeo): os dois pendentes da Fase 2.
3. Iniciar a **Fase 3** (catálogo e navegação: busca FTS5, favoritos, álbuns, filtros).
