# PhotoVault — Product Requirements Document

> **Versão:** 2.0 (substitui o PRD "PhotoManager" em Electron/Node)
> **Data:** 2026-09-28
> **Status:** Em desenvolvimento
> **Princípio central:** *A inteligência do sistema sugere. O usuário decide.*

Este documento reaproveita as regras de negócio do PRD original (PhotoManager) e as reescreve para a stack real do projeto: **Rust + Tauri 2 + Angular 22 + Optimus UI v2 + PrimeIcons + SQLite**. O plano de execução está em [PLANO.md](PLANO.md).

---

## Sumário

1. [Visão](#1-visão)
2. [Princípios e regras invioláveis](#2-princípios-e-regras-invioláveis)
3. [Plataformas e portabilidade](#3-plataformas-e-portabilidade)
4. [Stack](#4-stack)
5. [Arquitetura](#5-arquitetura)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Biblioteca](#7-biblioteca)
8. [Ingestão: scanner e indexação incremental](#8-ingestão-scanner-e-indexação-incremental)
9. [Pipeline de análise e fila de jobs](#9-pipeline-de-análise-e-fila-de-jobs)
10. [Metadados](#10-metadados)
11. [Hash, duplicatas, similares e sequências](#11-hash-duplicatas-similares-e-sequências)
12. [Qualidade técnica](#12-qualidade-técnica)
13. [Classificação multidimensional](#13-classificação-multidimensional)
14. [Fotos momentâneas e screenshots](#14-fotos-momentâneas-e-screenshots)
15. [Motor de sugestões e revisão](#15-motor-de-sugestões-e-revisão)
16. [Lixeira](#16-lixeira)
17. [Viagens e eventos](#17-viagens-e-eventos)
18. [Álbuns](#18-álbuns)
19. [Timeline, filtros e busca](#19-timeline-filtros-e-busca)
20. [Pessoas](#20-pessoas)
21. [IA local](#21-ia-local)
22. [Thumbnails e entrega de imagens](#22-thumbnails-e-entrega-de-imagens)
23. [Interface](#23-interface)
24. [Operações físicas no disco](#24-operações-físicas-no-disco)
25. [Segurança e privacidade](#25-segurança-e-privacidade)
26. [Requisitos não funcionais](#26-requisitos-não-funcionais)
27. [Definition of Done](#27-definition-of-done)
28. [Fora de escopo da v1](#28-fora-de-escopo-da-v1)

---

## 1. Visão

O **PhotoVault** é um aplicativo portátil (sem instalação) para **Windows 11 e Linux**, com evolução planejada para **Android**. Ele organiza bibliotecas pessoais de fotos e vídeos.

O usuário aponta o app para uma pasta desorganizada (tipicamente num HD externo). O PhotoVault indexa o conteúdo e constrói uma **biblioteca lógica inteligente** sem mexer nos arquivos originais.

O app deve:

- Indexar fotos e vídeos de forma incremental
- Organizar por ano, mês, dia, evento e sequência
- Detectar duplicatas exatas, duplicatas visuais, fotos semelhantes e sequências (quatro conceitos distintos)
- Avaliar qualidade técnica (nitidez, exposição, resolução)
- Identificar screenshots e fotos momentâneas
- Sugerir fotos para revisão e exclusão, **sem nunca excluir sozinho**
- Agrupar fotos em viagens e eventos
- Oferecer álbuns manuais e inteligentes, favoritos, filtros combinados e busca
- Manter uma lixeira segura, com restauração
- Funcionar 100% local e offline

---

## 2. Princípios e regras invioláveis

| # | Regra |
|---|-------|
| R1 | Nenhuma classificação resulta em exclusão automática. Única exceção, escolhida pelo usuário (desligada por padrão): cópias exatas (bytes idênticos) podem ir sozinhas para a lixeira da biblioteca, sempre restauráveis (§15). |
| R2 | Durante a indexação, o app **não move, não renomeia, não exclui e não escreve** nada dentro da pasta da biblioteca. |
| R3 | Qualquer alteração física (lixeira, mover, renomear) só acontece por ação explícita e confirmada pelo usuário, e fica registrada no log de operações. A edição (§29) nunca altera o original; a entrega grava cópias só fora da biblioteca. |
| R4 | Qualidade técnica e valor pessoal são dimensões separadas. Qualidade baixa **não** implica valor baixo. |
| R5 | Favoritas nunca aparecem como candidatas a exclusão (podem aparecer só como informação). |
| R6 | Uma falha em um arquivo não interrompe o processamento dos demais. |
| R7 | Nenhuma imagem sai do computador sem ação explícita do usuário. |
| R8 | O catálogo usa caminhos **relativos** à raiz da biblioteca, com separador `/` em qualquer SO. |

Ordem de prioridade do desenvolvimento: **segurança dos arquivos → catálogo confiável → performance → navegação → duplicatas → similaridade → sugestões → viagens/álbuns → IA avançada → organização física → Android.**

---

## 3. Plataformas e portabilidade

### 3.1 Alvos

| Plataforma | Formato de distribuição | Observações |
|------------|------------------------|-------------|
| Windows 11 x64 | `.zip` contendo `PhotoVault.exe` e as pastas de runtime | O WebView2 já vem no Windows 11. Sem MSI/NSIS. |
| Linux x64 | `.AppImage` (a WebKitGTK vai embutida) | Os dados ficam ao lado do `.AppImage`, e não dentro do ponto de montagem. |
| Android | APK (fase futura) | Os dados ficam no diretório privado do app. |

### 3.2 Estrutura portátil

```text
HD EXTERNO
├── Fotos/                       ← raiz da biblioteca (somente leitura durante a indexação)
│   ├── backup antigo/
│   ├── celular/
│   └── .photovault-trash/       ← lixeira (criada só na 1ª ação de "enviar para lixeira")
│
└── PhotoVault/                  ← pasta do app (copiável para outro HD/PC)
    ├── PhotoVault.exe | PhotoVault.AppImage
    ├── portable.flag            ← marca o modo portátil
    ├── data/
    │   └── catalog.db           ← SQLite (WAL)
    ├── thumbnails/{256,1024}/ab/cd/<media-id>.webp
    ├── cache/webview/           ← perfil do WebView2/WebKitGTK (NÃO usar %LOCALAPPDATA%)
    ├── models/                  ← modelos ONNX (fase IA)
    └── logs/photovault.log      ← rotação diária
```

### 3.3 Regras de resolução do diretório base (`base_dir`)

1. A variável de ambiente `PHOTOVAULT_HOME`, se definida.
2. Linux AppImage: o diretório de `$APPIMAGE` (e não `current_exe()`, que aponta para `/tmp/.mount_*`, somente leitura).
3. O diretório do executável, se tiver `portable.flag` e permissão de escrita.
4. Fallback: o diretório de dados do SO (`dirs::data_dir()/PhotoVault`), com aviso na UI.
5. Android: `app_data_dir()` do Tauri.

O diretório de dados do WebView deve ser configurado explicitamente para `base_dir/cache/webview`. Sem isso, o Tauri grava em `%LOCALAPPDATA%` ou `~/.local/share` e o app deixa de ser portátil.

### 3.4 Portabilidade da biblioteca entre computadores

A letra da unidade muda (`E:` vira `F:`) e os pontos de montagem mudam (`/media/joao/HD`). Por isso:

- Cada biblioteca tem um **`library_uid`**, gravado **no catálogo**. Opcionalmente, e com consentimento, ele também pode ir num arquivo `.photovault-library` na raiz.
- Ao abrir o app, se `root_path` não existir, a biblioteca aparece como **"Desconectada"**. O app tenta localizá-la automaticamente pelo caminho relativo ao `base_dir` (quando app e fotos estão no mesmo HD) e, se não achar, oferece a ação **"Relocalizar"**.
- `root_path` é salvo também como caminho **relativo ao `base_dir`** quando ambos estão no mesmo volume.
- mtime em exFAT/FAT32 tem granularidade de 2 s ou 10 ms: a comparação usa tolerância de 2 s.
- Comparação de caminhos: normalizar para `/` e para NFC (Unicode). Em volumes case-insensitive, comparar em minúsculas.

---

## 4. Stack

### 4.1 Frontend

| Item | Escolha |
|------|---------|
| Framework | Angular 22, standalone components, **signals**, zoneless change detection, OnPush |
| UI | **@openng/optimus-ui v2** (baseado em PrimeNG) + `@angular/cdk` (peer obrigatório) |
| Ícones | **PrimeIcons** (`pi pi-*`). Proibido misturar outros conjuntos. |
| Layout/utilitários | **Tailwind CSS 4** + `tailwindcss-primeui` (substitui o Bootstrap, ver ADR-001 em PLANO.md) |
| Tema | Preset Optimus (Aura) com tokens próprios: modo claro (padrão) com sidebar escura, e modo escuro |
| Roteamento | Angular Router com lazy loading por feature |
| IPC | `@tauri-apps/api` oficial + tipos gerados por **tauri-specta** (sem `__TAURI_INTERNALS__` manual) |
| Testes | Vitest (`@angular/build:unit-test`) |

Componentes Optimus a priorizar: `Button`, `Card`, `InputText`/`IconField` (busca), `Select`, `SelectButton` (grade/lista), `Slider` (tamanho da miniatura), `Tag`/`Chip` (qualidade, viagem, favorita), `Badge` (contadores do menu), `Tabs` (evento), `Carousel`/`Galleria` (visualizador, tira de miniaturas), `Drawer` (painel de informações no mobile), `Dialog`/`ConfirmDialog` (operações destrutivas), `Toast`, `ProgressBar`, `Skeleton`, `MeterGroup` (espaço em disco), `Scroller` (virtualização), `Avatar`, `Menu`/`ContextMenu`.

### 4.2 Backend

| Item | Escolha |
|------|---------|
| Linguagem | Rust stable, edition 2024 |
| Shell desktop/mobile | Tauri 2 (plugins: `dialog`, `opener`, `log`) |
| Runtime assíncrono | Tokio. Trabalho de CPU em **rayon** ou `spawn_blocking` (nunca decodificar imagem numa task async). |
| Banco | SQLite via `sqlx` (WAL, `foreign_keys=ON`, pool único), migrations versionadas embutidas; FTS5 para busca |
| Erros | `thiserror` no core, com erro serializável estável `{ code, message }` para o frontend |
| Logs | `tracing` + `tracing-appender` (arquivo rotativo em `logs/`) |
| Imagens | `image` (JPEG/PNG/WebP/GIF/TIFF/BMP), `fast_image_resize` |
| EXIF / vídeo | `nom-exif` (EXIF de JPEG/HEIC/TIFF e metadados de MP4/MOV) |
| HEIC/HEIF | `libheif-rs` atrás de feature flag (`heic`), com a lib nativa empacotada no build |
| Vídeo (miniaturas) | `ffmpeg` como *sidecar* opcional (feature `video-thumbs`). Sem ele, o vídeo aparece com ícone e duração. |
| Hashes | `sha2` (SHA-256 em streaming), `image_hasher` (pHash/dHash de 64 bits) |
| Geocodificação | `reverse_geocoder` offline (GeoNames cities1000) + tabela de estados BR |
| IA (fase 7) | `ort` (ONNX Runtime) com modelos em `models/` |

### 4.3 Dependências a remover

`tauri-plugin-fs` (o backend faz todo o I/O), `anyhow` no core, `mime_guess`, `base64` (substituído pelo protocolo `pv://`), `bootstrap`, `zone.js`, `@angular/animations`.

---

## 5. Arquitetura

### 5.1 Visão geral

```text
┌──────────────────────── Angular 22 (WebView) ────────────────────────┐
│ Shell (sidebar · topbar · painel de informações)                     │
│ Features: home · fotos · timeline · álbuns · viagens · pessoas ·     │
│           favoritos · organizar/* · revisão · lixeira · config       │
│ Stores (signals) ── IpcClient (tauri-specta) ── pv:// (imagens)      │
└───────────────────────────────┬──────────────────────────────────────┘
                 invoke / events (Channel) · protocolo pv://
┌───────────────────────────────▼──────────────────────────────────────┐
│ src-tauri  (camada fina: commands, protocolo, estado, janela)        │
└───────────────────────────────┬──────────────────────────────────────┘
┌───────────────────────────────▼──────────────────────────────────────┐
│ crates/photovault-core   (sem dependência de Tauri, testável)        │
│ core · catalog · ingestion · jobs · analysis · thumbnails ·          │
│ review · trash · search · events · filesystem                        │
└───────────────┬───────────────────────────────┬──────────────────────┘
             SQLite (catalog.db)            Filesystem (originais, thumbnails)
```

### 5.2 Workspace Cargo

```text
photoVault/
├── Cargo.toml                    # [workspace]
├── crates/
│   └── photovault-core/
│       └── src/
│           ├── core/             # config, paths (base_dir), error, clock, event bus
│           ├── db/               # pool, migrations, repositórios
│           ├── catalog/          # libraries, media, albums, events, people, labels
│           ├── ingestion/
│           │   ├── source.rs     # trait MediaSource
│           │   ├── local.rs      # LocalFolderSource
│           │   ├── scanner.rs    # discovery + diff incremental
│           │   └── metadata/     # exif, video, date fallback
│           ├── jobs/             # fila persistente, workers, throttling de I/O
│           ├── analysis/
│           │   ├── hashing/      # sha256, phash
│           │   ├── similarity/   # BK-tree/índice de hamming, agrupamento
│           │   ├── sequences/
│           │   ├── quality/      # nitidez, exposição, resolução
│           │   ├── classification/
│           │   ├── momentary/    # screenshots, fotos de tela, documentos...
│           │   ├── trips/        # eventos/viagens
│           │   └── vision/       # trait VisionAnalyzer (implementações futuras)
│           ├── thumbnails/
│           ├── review/           # motor de sugestões
│           ├── trash/
│           ├── search/           # FTS5 + filtros combinados
│           └── filesystem/       # operações seguras + log de operações
├── src-tauri/src/
│   ├── lib.rs                    # bootstrap
│   ├── state.rs                  # AppState { pool, jobs, config }
│   ├── protocol.rs               # pv://thumb/<id>/<size>, pv://media/<id>
│   └── commands/                 # um arquivo por domínio
└── src/                          # Angular
```

### 5.3 Contrato IPC

- Commands `snake_case` em Rust e `camelCase` em TS (conversão automática do Tauri). DTOs com `#[serde(rename_all = "camelCase")]`.
- **Tipos TS gerados** por `tauri-specta` em `src/app/core/ipc/bindings.ts`. É proibido escrever à mão o formato dos argumentos.
- Um único `AppState` com um **pool SQLite único**, criado no `setup`. Proibido abrir pool por command.
- Operações longas (scan, análise) retornam um `job_id` na hora e reportam progresso via `tauri::ipc::Channel` ou evento `job://progress` (throttle ≤ 10 eventos/s).
- Erros: `{ code: "LIBRARY_NOT_FOUND" | "PATH_NOT_ACCESSIBLE" | ..., message }`.
- Paginação por **keyset** (`captured_at`, `id`), não por `OFFSET`.

### 5.4 Abstrações obrigatórias (preparação Android/IA)

```rust
#[async_trait]
pub trait MediaSource: Send + Sync {
    fn id(&self) -> &str;
    fn list(&self) -> BoxStream<'_, Result<SourceEntry>>;       // path/uri, size, mtime
    async fn open(&self, entry: &SourceEntry) -> Result<Box<dyn Read + Send>>;
}

pub trait VisionAnalyzer: Send + Sync {
    fn name(&self) -> &'static str;
    fn analyze(&self, img: &DynamicImage) -> Result<VisionResult>;
}
```

Implementações: `LocalFolderSource` (v1) e, no futuro, `AndroidMediaStoreSource`, `NetworkSource`, além de `SceneAnalyzer`, `FaceAnalyzer` e `EmbeddingAnalyzer`.

---

## 6. Modelo de dados

SQLite com migrations numeradas e imutáveis em `crates/photovault-core/migrations/`. IDs são UUID v7 (ordenáveis). Datas em ISO-8601 UTC, com o offset local guardado à parte.

```text
libraries        id, uid, name, root_path, root_path_rel, source_kind, status(connected|disconnected),
                 created_at, last_scan_at
media            id, library_id, relative_path, filename, extension, media_type(image|video),
                 file_size, file_mtime, status(active|missing|trashed),
                 width, height, orientation, duration_ms,
                 captured_at, captured_at_local, date_source(exif_original|exif_datetime|file_meta|mtime),
                 gps_lat, gps_lon, place_id,
                 camera_make, camera_model, lens, iso, aperture, shutter, focal_length,
                 sha256, phash, is_favorite, personal_value(unknown|low|high),
                 sequence_id, indexed_at, updated_at
                 UNIQUE(library_id, relative_path)
media_quality    media_id, sharpness, brightness, clipped_high, clipped_low, megapixels,
                 level(low|medium|high), flags(blurry,dark,overexposed,low_res,empty), analyzed_at
labels           id, dimension(category|scene|momentary|tag), value, UNIQUE(dimension,value)
media_labels     media_id, label_id, score, source(auto|manual)
sequences        id, library_id, started_at, ended_at, size, best_media_id
similarity_groups id, library_id, kind(exact_duplicate|visual_duplicate|similar), best_media_id
similarity_members group_id, media_id, distance
review_candidates id, media_id, reason, score, group_id, status(pending|kept|ignored|trashed),
                 created_at, decided_at          -- 1 linha por motivo
events           id, library_id, kind(trip|event), title, started_at, ended_at,
                 place_summary, status(suggested|accepted|ignored|edited)
event_media      event_id, media_id
albums           id, library_id, name, kind(manual|smart), rule_json, cover_media_id
album_media      album_id, media_id, position
places           id, name, admin1, country_code, lat, lon
trash_items      id, media_id, original_relative_path, trash_relative_path,
                 deleted_at, restored_at, purged_at
operations_log   id, kind, payload_json(before/after), status, created_at, finished_at
jobs             id, library_id, media_id, stage, status(queued|running|done|failed|skipped),
                 attempts, error, updated_at
settings         key, value
media_fts        FTS5(filename, relative_path, place, event, albums, labels)
people / faces   (fase 7)
```

A classificação é **multidimensional** (tabela `labels`/`media_labels`, mais `media_quality`, `is_favorite`, `event_media`, `sequence_id`). É proibida uma coluna única `classification`.

---

## 7. Biblioteca

- Uma `Library` representa uma pasta raiz. O app suporta **várias bibliotecas**, e a biblioteca ativa aparece no topo da sidebar.
- Criar biblioteca: nome + pasta (seletor nativo). Validar que a pasta existe, é legível e não está dentro de outra biblioteca nem dentro da pasta do app.
- Remover biblioteca: remove **apenas o catálogo e as miniaturas**, nunca os arquivos (pede confirmação).
- Status: *Conectada*, *Desconectada* ou *Escaneando*. Uma biblioteca desconectada continua navegável pelas miniaturas.
- O rodapé da sidebar mostra o volume e o espaço livre (ex.: "HD Externo (E:) — 512 GB livres de 1 TB").

---

## 8. Ingestão: scanner e indexação incremental

### 8.1 Formatos

Imagens: `jpg jpeg png webp heic heif tif tiff gif bmp`, e RAW (`dng cr2 nef arw`) apenas como catálogo, sem miniatura na v1.
Vídeos: `mp4 mov m4v mkv avi webm 3gp`.
A lista fica numa tabela de configuração, extensível.

### 8.2 Descoberta

- Percurso recursivo sem seguir symlinks. Ignora `.photovault-trash`, `$RECYCLE.BIN`, `System Volume Information`, `.Trash-*`, `@eaDir`, pastas ocultas (configurável) e arquivos com menos de 1 KB.
- `relative_path` normalizado com `/` e NFC.
- Apenas um scan por biblioteca por vez (lock). Cancelamento por `CancellationToken` por job.

### 8.3 Diff incremental

| Situação | Critério | Ação |
|----------|----------|------|
| Novo | `relative_path` não existe no catálogo | inserir e enfileirar o pipeline completo |
| Modificado | `size` ou `mtime` (tolerância 2 s) diferente | atualizar e reprocessar, invalidando hash, miniatura e análises |
| Inalterado | igual | nada |
| Ausente | existe no catálogo e não foi encontrado | `status = missing` (não apaga, para preservar favoritos e álbuns) |
| Movido/renomeado | ausente + novo com o mesmo `sha256` | religar ao registro antigo, mantendo favoritos, álbuns e revisões |

Segunda execução com 50 mil conhecidos + 300 novos + 20 modificados: processa só os 320.

### 8.4 Progresso

O evento de progresso traz: `phase` (discovering | indexing | analyzing), `processed`, `total`, `currentPath`, `new`, `modified`, `missing`, `errors`, `etaSeconds`. Ao final, um resumo persistido e exibido em toast.

---

## 9. Pipeline de análise e fila de jobs

```text
Discovery → Metadados básicos → SQLite → EXIF/vídeo → Miniaturas → SHA-256 → pHash
   → Sequências → Qualidade → Similaridade → Classificação/Momentâneas → Eventos → Sugestões
```

- Cada estágio é idempotente e registrado em `jobs` (retomável após fechar o app).
- A UI fica utilizável assim que o estágio "Miniaturas" termina para um arquivo. A galeria aparece em menos de 30 s mesmo em bibliotecas grandes.
- Concorrência: CPU = `num_cpus - 1` (mínimo 1). Leitura de disco: semáforo de I/O (padrão 2 para HD externo, 8 para SSD, configurável).
- Estágios que dependem da biblioteca inteira (similaridade, sequências, eventos) rodam em lote ao final e de forma incremental (só os afetados).
- Erro num arquivo: `jobs.status = failed` com a mensagem, e o pipeline segue. A tela "Configurações → Diagnóstico" lista as falhas.
- Pausar e retomar a análise em segundo plano.

---

## 10. Metadados

Extrair quando disponíveis: data e hora originais, fuso (OffsetTimeOriginal), GPS, fabricante, câmera, lente, orientação, ISO, abertura, velocidade, distância focal, dimensões, formato, tamanho e duração (vídeo).

Fallback de data, com a origem registrada em `date_source`:

```text
EXIF DateTimeOriginal → EXIF DateTime/CreateDate → QuickTime CreationDate (vídeo)
  → data no nome do arquivo (IMG_20250712_143201, WhatsApp "IMG-20250712-WA0001") → mtime
```

A orientação EXIF é aplicada nas miniaturas e no visualizador.

---

## 11. Hash, duplicatas, similares e sequências

São **quatro conceitos diferentes**, que nunca se misturam:

| Conceito | Definição | Técnica | Motivo de revisão |
|----------|-----------|---------|-------------------|
| Duplicata exata | mesmo conteúdo binário | SHA-256 igual | `EXACT_DUPLICATE` |
| Duplicata visual | mesma imagem com resize, recompressão ou pequena edição | pHash com distância de Hamming ≤ 4 | `VISUAL_DUPLICATE` |
| Semelhantes | fotos diferentes da mesma cena | pHash ≤ 12 **e** proximidade temporal/GPS | `SIMILAR` (informativo) |
| Sequência | fotos tiradas em rajada | intervalo ≤ 3 s entre consecutivas, mesma câmera, ≥ 3 fotos | `SIMILAR_SEQUENCE` |

- Em cada grupo, o sistema elege a **melhor candidata** (maior resolução, depois nitidez, exposição, favorita e data de arquivo mais antiga). As demais viram "possíveis para revisão". Nada é excluído automaticamente.
- Os limiares ficam em `settings`.
- Índice de similaridade: BK-tree em memória sobre o pHash, reconstruído incrementalmente.

---

## 12. Qualidade técnica

Calculada sobre a miniatura de 1024 px, com resultado em `media_quality`:

| Métrica | Técnica | Flag |
|---------|---------|------|
| Nitidez/blur | variância do Laplaciano (normalizada por resolução) | `BLURRY` |
| Exposição | histograma de luminância (média, % clipped) | `DARK`, `OVEREXPOSED` |
| Resolução | megapixels < 1 MP (configurável) | `LOW_RESOLUTION` |
| Imagem vazia | entropia e desvio padrão baixos | `LOW_INFORMATION` |
| Proporção | proporção atípica (ex.: > 3:1) | informativo |

O `level` (baixa, média ou alta) é exibido como chip "Qualidade: Alta". Ele **nunca** altera `personal_value`.

---

## 13. Classificação multidimensional

Exemplo de uma foto:

```text
year: 2025 · event: Gramado · category: viagem · quality: high
sequence: 129 · favorite: true · review_status: none
scene: paisagem 0.92, natureza 0.88 (fase IA)
```

- Dimensões: `category`, `scene`, `momentary`, `tag` (manual).
- Tags manuais podem ser criadas e removidas pelo usuário. Tags automáticas guardam `score` e `source=auto`.
- Na v1 (sem IA), as categorias vêm de heurísticas: viagem (evento do tipo trip), screenshot, documento (proporção A4 + baixo número de cores), etc.

---

## 14. Fotos momentâneas e screenshots

Fotos momentâneas são registros temporários: tela, preço, produto, documento, endereço, informação, foto acidental, objeto.

**Heurísticas da v1 (sem IA):**

- **Screenshot:** sem EXIF de câmera + dimensões iguais a resoluções de tela conhecidas, **ou** nome `Screenshot*`, `Captura de tela*`, `Screen Shot*`, **ou** pasta `Screenshots`. Motivo `SCREENSHOT`.
- **Foto de tela (moiré/retângulo luminoso), documento, recibo:** baixa saturação + alto contraste + predominância de texto (bordas horizontais). Label `momentary:*`.
- **Acidental:** muito escura ou muito borrada + inclinação + tempo de exposição curto em sequência. Motivo `ACCIDENTAL`.
- **Imagens de apps de mensagem** (WhatsApp etc.): label informativo, não é motivo por si só.

O resultado é `POSSIBLE_MOMENTARY` com um score de 0 a 1. Acima do limiar, gera o motivo `MOMENTARY`. Na fase 7, as heurísticas passam a ser complementadas por classificação de cena.

---

## 15. Motor de sugestões e revisão

Todas as categorias de baixa retenção convergem para `review_candidates`, com motivos:

```text
EXACT_DUPLICATE · VISUAL_DUPLICATE · SIMILAR_SEQUENCE · BLURRY · DARK · OVEREXPOSED
LOW_RESOLUTION · SCREENSHOT · MOMENTARY · ACCIDENTAL · LOW_INFORMATION
```

- Uma foto pode ter vários motivos. O score de retenção combina os motivos com pesos configuráveis.
- **Favoritas e fotos marcadas "Manter" não geram candidatos novos** para o mesmo motivo.
- As telas "Organizar" (duplicatas, semelhantes, baixa qualidade, momentâneas, screenshots) e "Revisão" (tudo junto, priorizado) mostram contadores na sidebar.
- Ações por foto e por grupo: **Manter · Favoritar · Ignorar sugestão · Enviar para lixeira**. Há também ação em lote com confirmação.
- Nunca existe "Excluir automaticamente" como comportamento padrão.
- Histórico de decisões (`decided_at`) consultável.

- **Cópias exatas** (mesmo SHA-256): "Remover todas as cópias exatas" envia para a lixeira todas menos a sugerida de cada grupo, com confirmação; os álbuns e tags das cópias passam para a foto que fica; favoritas e as marcadas "Manter" ficam. Opcionalmente (Configurações → Revisão, desligado por padrão) isso acontece sozinho depois de cada análise, sempre para a lixeira da biblioteca.
---

## 16. Lixeira

```text
Foto → Enviar para lixeira (confirmação) → <raiz>/.photovault-trash/<data>/<relative_path>
     → tela Lixeira → Restaurar | Excluir definitivamente (confirmação dupla)
```

- A lixeira fica **no mesmo volume da biblioteca**, para que a operação seja um `rename` atômico e não uma cópia.
- Grava `original_relative_path`, `trash_relative_path` e `deleted_at`, e registra a operação em `operations_log`.
- Restaurar devolve o arquivo ao caminho original. Se já houver um arquivo lá, pergunta se deve renomear.
- "Esvaziar lixeira" e a limpeza automática (opcional, desligada por padrão, > N dias) pedem confirmação.
- Opção de enviar para a lixeira do SO em vez disso (crate `trash`), configurável.

---

## 17. Viagens e eventos

- **Evento:** agrupamento por intervalos de tempo (lacuna de mais de 6 h separa eventos) e proximidade GPS.
- **Viagem:** evento com distância do "local base" maior que X km (o local base é o cluster GPS mais frequente) e duração de pelo menos 1 dia.
- Título sugerido pelos lugares (geocodificação offline), por exemplo "Viagem para Gramado e Canela — 10 a 12 jul 2025 — 426 fotos, 38 vídeos".
- O usuário pode **aceitar, editar (título, datas, fotos) ou ignorar**. Eventos ignorados não voltam a ser sugeridos.
- A tela do evento tem abas **Fotos · Mapa (futuro) · Linha do tempo · Pessoas (futuro) · Informações** e cards por dia (ex.: "11 JUL · Gramado · 212 fotos").

---

## 18. Álbuns

- **Manual:** o usuário escolhe as fotos (seleção múltipla, "Adicionar ao álbum").
- **Inteligente:** definido por regra (`rule_json`) sobre os mesmos filtros da busca, por exemplo `year=2025 AND event=Gramado AND favorite AND quality=high`.
- **Sugeridos:** melhores fotos, para revisar, por ano, viagens, sequências, screenshots.
- Álbuns **nunca duplicam arquivos**: são só referências no catálogo.

---

## 19. Timeline, filtros e busca

- **Timeline:** Ano → Mês → Dia → Evento → Sequência, com um *scrubber* lateral de anos e agrupamento visual das sequências (pilha).
- **Filtros combináveis:** ano, mês, intervalo de datas, evento, álbum, local, pessoa, categoria, qualidade, favorito, tipo de mídia, status de revisão, câmera. Os filtros ativos aparecem como chips removíveis e persistem por biblioteca.
- **Busca (Ctrl+K):** nome, data ("2025", "julho 2025"), evento, álbum, local, categoria e tag, via FTS5, com resposta em menos de 100 ms para 50 mil itens.
- **Busca semântica** ("fotos de praia", "fotos do gato") fica para a fase 7, com embeddings.
- **Ordenação:** mais recentes, mais antigas, nome, tamanho, qualidade.

---

## 20. Pessoas

- Detecção de rostos local, agrupamento por pessoa e nomeação ("Sem nome" vira "Maria"). Tudo local, e nenhuma imagem é enviada para serviços externos.
- **Consentimento próprio:** os modelos de rostos (39 MB) são um pacote separado da busca por conteúdo, baixado só quando o usuário pede (Configurações → IA local). Sem eles, "Pessoas" explica o que é e aponta para as configurações.
- **Grupos sugeridos** aparecem em "Sem nome" quando a mesma pessoa está em 3 fotos ou mais. Rostos pequenos (menos de 40 px na prévia de 1024) ou de perfil aparecem na foto, mas não entram nos grupos.
- **Decisões do usuário nunca são desfeitas pelo reagrupamento:** dar nome confirma os rostos do grupo; "Não é esta pessoa" tira o rosto para sempre daquela pessoa; "Quem é?" num rosto da foto coloca-o na pessoa com esse nome (ou cria); dois grupos com o mesmo nome viram um; "Juntar pessoas"; "Ocultar" tira a pessoa da lista e da busca, mas as fotos novas dela continuam indo para ela.
- **Busca pelo nome** na busca de sempre, sem diferença de acento ou maiúscula: uma palavra igual a uma palavra do nome ("Ana", "Souza") exige a pessoa, e o resto restringe ("Ana praia", "Ana 2024", "Ana Bruno" = as duas); um nome sendo digitado ("an") acrescenta as fotos da pessoa. Filtro por pessoa na tela da pessoa.
- **"Não é um rosto"** (boneco, desenho): o rosto some da foto e de Pessoas, para sempre.
- Pessoas são as mesmas em todas as bibliotecas; listas e contagens são da biblioteca ativa.
- Remover os modelos de rostos apaga os rostos, as pessoas e os nomes (com confirmação).

---

## 21. IA local

- Modular via `VisionAnalyzer`. O catálogo não depende de nenhum modelo específico.
- Modelos ONNX opcionais em `models/`, baixados sob demanda **com consentimento**. O app funciona sem eles.
- Usos: classificação de cena (chips "Paisagem 0.92"), detecção de rostos e olhos fechados, embeddings (CLIP) para busca semântica e melhor candidata por composição.
- **Pacotes de modelos:** "conteúdo" (CLIP, 228 MB) e "rostos" (YuNet + SFace, 39 MB), cada um com download, consentimento e remoção próprios.
- **Fase 7a (v1.3):** um modelo só, CLIP ViT-B/32 (imagem) + codificador de texto multilíngue treinado no mesmo espaço (a busca entende português). 228 MB, int8, CPU, ONNX Runtime embutido no executável. O download mostra o tamanho, a origem (Hugging Face) e as licenças antes de começar, e cada arquivo é conferido por SHA-256 fixado no código.
- Busca por conteúdo é parte da busca normal: o texto casa com o nome/pasta/local/álbum **ou** com o conteúdo da foto; os resultados seguem a ordenação escolhida.
- Desligar ou remover a IA volta o app ao comportamento sem ela; remover apaga os modelos e a análise de conteúdo.

---

## 22. Thumbnails e entrega de imagens

- Tamanhos: **256** (grade) e **1024** (visualizador e análise). WebP com perda (qualidade 80), respeitando a orientação EXIF.
- Caminho: `thumbnails/<size>/<id[0..2]>/<id[2..4]>/<id>.webp`.
- Entrega por um **protocolo customizado `pv://`** registrado no Tauri, com cache HTTP e streaming:
  - `pv://thumb/<media_id>/256`
  - `pv://media/<media_id>` (original, para zoom 100% e vídeo, com suporte a `Range`)
- O protocolo resolve o arquivo **pelo id no catálogo**: nunca aceita caminhos vindos do frontend (evita path traversal).
- Proibido trafegar imagem em base64 pelo IPC.
- A galeria usa **virtualização** (`Scroller`/CDK), carregamento progressivo (placeholder, depois 256) e nunca carrega originais na grade.

---

## 23. Interface

A referência visual é o mockup anexado ao pedido (desktop claro com sidebar escura, visualizador escuro, tela de viagem escura e mobile). Todo o texto da interface é em pt-BR.

### 23.1 Shell desktop

```text
┌─────────────┬───────────────────────────────────────────────┬──────────────┐
│ PhotoVault  │ [≡] [ Buscar fotos, pessoas, locais… Ctrl K ] │ Informações  │
│             │                 [+ Importar] [▦|☰] (avatar)   │  (painel     │
│ Início      ├───────────────────────────────────────────────┤  recolhível) │
│ Todas       │                                               │              │
│ Timeline    │              conteúdo da rota                 │ foto         │
│ Álbuns      │                                               │ nome/data/   │
│ Viagens     │                                               │ local        │
│ Pessoas     │                                               │ chips        │
│ Favoritos   │                                               │ metadados    │
│ ORGANIZAR   │                                               │ classificação│
│ Duplicatas n│                                               │ sugestões    │
│ Semelhantesn│                                               │              │
│ Baixa qual.n│                                               │              │
│ Momentâneasn│                                               │              │
│ Screenshotsn│                                               │              │
│ Revisão    n│                                               │              │
│ BIBLIOTECA  │                                               │              │
│ Bibliotecas │                                               │              │
│ Configuraç. │                                               │              │
│ ▣ HD (E:)   │                                               │              │
│ ▬▬▬▬ 512 GB │                                               │              │
└─────────────┴───────────────────────────────────────────────┴──────────────┘
```

- **Sidebar** escura (240 px, recolhível para ícones): logo, grupos *Principal*, *Organizar* (com `Badge` de contagem) e *Biblioteca*, e no rodapé o volume com `MeterGroup`.
- **Topbar:** busca global (`IconField`, atalho Ctrl+K), "Importar" (= adicionar ou escanear biblioteca), alternador grade/lista (`SelectButton`), avatar/menu (tema, sobre).
- **Painel de informações** à direita (320 px, `Drawer` no mobile), aberto ao selecionar uma foto: miniatura, favoritar, nome, data, local; chips (Qualidade, Viagem, Favorita); Metadados (data, local, câmera, focal, abertura, velocidade, ISO, dimensões/MP, tamanho, formato); Classificação (chips com score); Sugestões (ex.: "Foto principal da sequência — Excelente qualidade").

### 23.2 Início

- **Hero:** banner com uma foto de destaque da biblioteca (favorita de alta qualidade), "Bem-vindo ao PhotoVault" e o subtítulo.
- **Cards de estatística:** Fotos, Vídeos, Viagens e Favoritos (ícone colorido + número formatado pt-BR "48.293").
- **Anos:** carrossel de cards (capa + "2025 · 8.392 fotos") que leva à timeline filtrada.
- **Fotos recentes:** grade com `Slider` de tamanho, alternância de densidade e ordenação (`Select` "Mais recentes"). Cada miniatura tem sobreposição de favorito (coração), seleção (círculo) e duração no caso de vídeo.
- **Estado vazio** (sem biblioteca): card central "Adicionar biblioteca" com o seletor de pasta.

### 23.3 Visualizador (tema escuro)

- Topo: voltar, contador "12 / 426" (dentro do contexto de navegação atual: filtro, álbum ou evento), ações: favoritar, lixeira, informações, "melhorar/analisar" (futuro), mais.
- Imagem central (1024 px, e o original ao dar zoom), setas laterais, zoom (roda, duplo clique, + e −), teclado (← → Esc F I Del).
- Tira de miniaturas inferior com rolagem.
- Painel "Detalhes": nome, data, local; chips; **Sequência** ("6 fotos semelhantes · Ver grupo"); **Sugestões** (melhor candidata, excelente qualidade, possível duplicata (2) · Revisar); **Ações** (Favoritar, Adicionar ao álbum, Enviar para lixeira, Mais ações).
- Vídeo: player HTML5 via `pv://media/<id>`.

### 23.4 Viagem/Evento (tema escuro)

Cabeçalho com título editável, período e contagens; abas; carrossel de destaque; tira de miniaturas; cards por dia (data, local, quantidade). O dia selecionado fica destacado.

### 23.5 Organizar e Revisão

Grupos em cards: fotos do grupo lado a lado, "Melhor candidata" destacada, motivo e score, e ações por foto e por grupo. Uma barra de ação em lote aparece com seleção múltipla.

### 23.6 Mobile (Android, futuro — mas o layout responsivo já nasce na v1)

Topo com logo e busca; chips de navegação (Todas, Álbuns, Viagens, Favoritos); "Fotos recentes" em grade de 4 colunas; grade "Organizar" de cards coloridos com contagem; bottom navigation (Início, Fotos, Organizar, Álbuns, Mais). Breakpoint: abaixo de 768 px, a sidebar vira bottom nav e o painel de informações vira `Drawer`.

### 23.7 Design tokens

| Token | Claro | Escuro |
|-------|-------|--------|
| `--pv-sidebar-bg` | `#0f172a` | `#0b1120` |
| `--pv-bg` | `#f5f7fb` | `#0f172a` |
| `--pv-surface` | `#ffffff` | `#1e293b` |
| `--pv-primary` | `#3b5bfd` | `#6b8cff` |
| `--pv-radius` | 12 px (cards), 8 px (miniaturas) | idem |

Cores das categorias de "Organizar" (mobile e ícones): duplicatas vermelho, semelhantes laranja, baixa qualidade roxo, momentâneas azul, screenshots verde, revisão vermelho-rosado.

---

## 24. Operações físicas no disco

Fase 8: mover, renomear e reorganizar. Toda operação física:

1. mostra um **preview** ANTES/DEPOIS por arquivo;
2. exige confirmação;
3. é registrada em `operations_log` com rollback possível;
4. aborta de forma segura se o volume for desconectado (estado consistente, com retomada).

**Organizar pastas (v2.1):**

- Regra por modelo de pastas e de nome (`{ano}/{mes} - {mes_nome}`, `{ano}/{evento|mes}`, `{data}_{hora}`), aplicada à biblioteca, a um álbum, a uma viagem/evento ou à seleção. Sempre dentro da pasta da biblioteca.
- Nada é sobrescrito: um nome ocupado ganha " (2)" (comparando sem diferenciar maiúsculas). Fotos sem data confiável vão para "Sem data". Arquivos auxiliares (`.xmp`, `.aae`, `.json`) acompanham a foto.
- Só fotos ativas; a lixeira e os ausentes não se movem. Uma foto alterada depois da prévia é pulada.
- A execução pode ser pausada; um disco desconectado pausa sem falhar; ao reabrir o app, um movimento interrompido é concluído ou desfeito, e o lote espera a retomada.
- "Desfazer" devolve cada arquivo ao caminho e nome de antes, em ordem inversa, e lista o que não pôde voltar.
- Durante a organização, não há scan da biblioteca.

---

## 25. Segurança e privacidade

- Local-first, offline-first, privacy-first. **Nenhuma chamada de rede** na v1 (a CSP bloqueia `connect-src` externo). A partir da v1.3, a única exceção é o download dos modelos de IA (§21), feito pelo backend quando o usuário pede; nenhuma foto, metadado ou texto de busca sai do computador.
- CSP restritiva: `default-src 'self'; img-src 'self' pv: data:; media-src pv:; connect-src ipc: http://ipc.localhost`.
- Capabilities do Tauri 2 mínimas (`core:default`, `dialog:allow-open`). O frontend não tem acesso direto ao filesystem.
- O protocolo `pv://` só serve arquivos resolvidos pelo catálogo.
- Proteção contra operações em massa acidentais: lote acima de 500 itens pede confirmação digitada.

---

## 26. Requisitos não funcionais

| Métrica | Meta |
|---------|------|
| Descoberta + indexação básica de 50 mil arquivos (HD USB 3) | < 5 min |
| Primeira galeria visível após escolher a pasta | < 30 s |
| Miniatura 256 px (JPEG 12 MP) | < 200 ms por arquivo e por núcleo |
| Busca/filtro em 50 mil itens | < 100 ms |
| Rolagem da galeria | 60 fps (sem jank com 50 mil itens) |
| Memória em uso normal | < 500 MB |
| Tamanho do executável (sem modelos/ffmpeg) | < 30 MB |
| Perda de dados / modificação não autorizada | zero |

---

## 27. Definition of Done

Uma funcionalidade só está pronta quando:

- [ ] compila sem warnings em Windows e Linux (`cargo clippy -D warnings`, `ng build`)
- [ ] tem testes (unitários no core; testes de integração com fixtures reais em `tests/fixtures/`)
- [ ] trata erros (código + mensagem pt-BR na UI, nunca `alert()`)
- [ ] não bloqueia a UI; operações longas mostram progresso e são canceláveis
- [ ] deixa os arquivos originais intactos (teste automatizado que compara hash da pasta de fixtures antes e depois)
- [ ] tem migrations versionadas quando houver mudança de schema
- [ ] tem logs `tracing` nos pontos relevantes
- [ ] usa Optimus UI quando existe componente adequado, PrimeIcons nos ícones e Tailwind no layout
- [ ] foi validada com arquivos reais, incluindo corrompidos (que não podem interromper o processamento)
- [ ] passou no CI (matriz Windows + Linux)

---

## 28. Fora de escopo da v1

IA com modelos (cena, rostos, embeddings), mapa, organização física (mover/renomear), app Android, sincronização, edição de imagem, nuvem. A arquitetura (seção 5.4) deve permitir tudo isso **sem refatoração estrutural**.

Edição de imagem entra a partir da v2.3 como "Melhorar fotos" (§29). Continuam fora: RAW, IA que gera pixels (remoção de ruído, ampliação, retoque de pele ou de objetos) e máscaras locais.

---

## 29. Melhorar fotos e entrega (v2.3+)

Edição profissional **automática** em lote para quem não é fotógrafo: o usuário escolhe as fotos, um estilo e a intensidade; o app faz o resto.

**Regras:**

- **Não destrutiva.** O ajuste é uma "receita" guardada no catálogo. Os originais nunca mudam (R2/R3). Desfazer volta à foto original a qualquer momento, por foto ou pelo lote inteiro.
- **Entrega = cópias JPEG numa pasta escolhida pelo usuário, fora de qualquer biblioteca e da pasta do app.** Nada é sobrescrito (" (2)", sem diferenciar maiúsculas); um arquivo interrompido nunca fica pela metade; disco desconectado pausa. Cada arquivo gravado passa pelo `operations_log`.
- **O que se vê é o que se entrega:** a prévia e a entrega usam o mesmo motor.
- Fora do escopo do automático: screenshots, documentos, vídeos e fotos na lixeira. Formatos: JPEG, PNG, TIFF (inclusive 16 bits) e WebP. RAW e HEIC ficam de fora.

**Fluxo (Menu → Melhorar fotos):**

1. Quais fotos: todas, a seleção, um álbum ou uma viagem/evento.
2. Estilo: Natural (padrão), Vivo, Quente, Suave, Preto e branco, Cinema; um controle de intensidade.
3. Antes/depois, "Aplicar" e "Entregar…".

Ajuste fino (exposição, temperatura, contraste…) é opcional e sempre **somado** ao automático.

**Como o automático decide (camadas):**

1. **Correção técnica** (algoritmos próprios, sempre disponível): balanço de branco, exposição, realces e sombras, pretos e brancos, contraste, vibração protegendo a pele, nitidez de saída. Luz proposital (pôr do sol, palco) é preservada.
2. **Contexto da IA local** (§21, se ligada): exposição e cor medidas nos rostos; tratamento por tipo de cena.
3. **Sessão uniforme:** as fotos de um mesmo escopo ou evento são harmonizadas entre si.
4. **Gosto do usuário** (v2.5): os ajustes finos que o próprio usuário faz viram um viés pessoal sobre o automático, guardado no catálogo e apagável.

Nenhum modelo de retoque treinado com dados de uso restrito a pesquisa (ex.: MIT-Adobe FiveK, PPR10K) é usado. A IA só produz parâmetros, nunca pixels.

**Entrega:** tamanho (original, 4096, 2048), qualidade, nome por modelo (`{titulo}_{seq:3}`), metadados (copiar, sem GPS ou mínimo; autor e copyright), marca d'água opcional. Perfil de cor sRGB embutido; orientação já aplicada.
