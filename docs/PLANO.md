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

**Aceite:** num Linux e num Windows 11 limpos, criar uma biblioteca com 1.000 fotos, ver o progresso, cancelar, reescanear e ver a galeria com miniaturas. *Pendente de validação manual na UI (os testes automatizados e o boot do binário já foram verificados).*

---

### Fase 1 — Fundação (≈ 2 semanas) → `v0.3`

**Backend**
- [ ] Workspace Cargo e `crates/photovault-core` com a estrutura da seção 5.2 do PRD
- [ ] `core::paths`: completar a resolução de `base_dir` (PRD 3.3) com `portable.flag` e o fallback para o diretório do SO (`PHOTOVAULT_HOME` e AppImage já existem)
- [ ] Diretório de dados do WebView em `base_dir/cache/webview` (`WebviewWindowBuilder::data_directory`)
- [ ] `core::error` (thiserror + DTO `{code,message}`)
- [ ] Nova migration `0001_init.sql` com o schema completo do PRD (seção 6)
- [ ] `tauri-specta`: geração de `src/app/core/ipc/bindings.ts` no build de debug
- [ ] Protocolo `pv://`: suporte a `Range` e vídeo em `pv://media` (thumb e imagem já existem desde a Fase 0)
- [ ] CSP restritiva e capabilities mínimas
- [ ] Trait `MediaSource` + `LocalFolderSource`; trait `VisionAnalyzer` (vazia)

**Frontend**
- [ ] Remover Bootstrap e zone.js; Tailwind 4 + `tailwindcss-primeui`; zoneless; OnPush
- [ ] Tema Optimus (Aura) com os tokens do PRD 23.7, claro e escuro
- [ ] Estrutura `src/app/{core,layout,features,shared}` e rotas lazy
- [ ] **Shell** conforme o mockup: sidebar escura (grupos, badges, rodapé de disco), topbar (busca, Importar, grade/lista, avatar), painel de informações recolhível, layout responsivo (bottom nav abaixo de 768 px)
- [ ] Stores com signals: `LibraryStore`, `MediaStore`, `JobStore`, `UiStore`
- [ ] Toast global de erros, skeletons e estados vazios
- [ ] Telas: **Bibliotecas** (criar, listar, remover, status conectada/desconectada, relocalizar) e **Configurações** (base_dir, limites de concorrência, tema)

**Qualidade/entrega**
- [ ] Testes: `cargo test` no core (paths, normalização, migrations) e Vitest nas stores
- [ ] CI com matriz `windows-latest` + `ubuntu-22.04`: `fmt`, `clippy -D warnings`, `test`, `ng build`, `ng test`
- [ ] Pipeline de release portátil: `tauri build --no-bundle` + zip (Windows) e `--bundles appimage` (Linux), com o artefato já contendo o `portable.flag`
- [ ] Teste manual: rodar a partir de um pendrive nos dois SOs e confirmar que nada é gravado fora da pasta do app

**Aceite:** o app abre no shell novo, gerencia bibliotecas e roda portátil nos dois SOs. O visual da sidebar/topbar corresponde ao mockup.

---

### Fase 2 — Ingestão completa (≈ 2,5 semanas) → `v0.4`

- [ ] Scanner: exclusões (PRD 8.2), lock por biblioteca, `CancellationToken`
- [ ] Diff incremental completo: novo, modificado (size + mtime com tolerância), ausente (`missing`), movido (via sha256)
- [ ] Módulo `jobs`: fila persistida, estágios idempotentes, retomada após reiniciar, pausar/retomar, rayon + semáforo de I/O configurável
- [ ] Progresso via `Channel` com fases, contadores e ETA; resumo final
- [ ] Metadados: `nom-exif` (EXIF + QuickTime), fallback de data com `date_source`, data a partir do nome do arquivo, orientação
- [ ] Miniaturas 256 e 1024 (`fast_image_resize`), WebP **com perda** (crate `webp`), com orientação aplicada
- [ ] SHA-256 em streaming e pHash
- [ ] HEIC atrás da feature `heic` (libheif empacotada no build Windows e no AppImage)
- [ ] Vídeo: duração e metadados; miniatura com o sidecar ffmpeg (feature `video-thumbs`)
- [ ] Geocodificação offline de GPS para `places`
- [ ] Tela Configurações → Diagnóstico (jobs com falha)
- [ ] Fixtures de teste: JPEG com e sem EXIF, rotacionado, HEIC, PNG screenshot, corrompido, vídeo curto. Teste que confirma que os originais não mudam (hash da pasta antes e depois).

**Aceite:** 50 mil arquivos num HD USB indexados em menos de 5 min (estágios básicos); reescanear processa só a diferença; arquivos corrompidos aparecem no diagnóstico sem parar o scan.

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

1. Validar a Fase 0 manualmente na UI (`npm run tauri:dev`) no Linux e no Windows 11.
2. Instalar as dependências de sistema no Linux (`sudo apt install build-essential pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf`), porque hoje falta o `pkg-config` e os pacotes `-dev`.
3. Iniciar a **Fase 1**, começando pelo workspace Cargo (ADR-002) e pelo shell do layout novo.
