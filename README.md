# PhotoVault

Aplicativo portátil (sem instalação) para organizar bibliotecas pessoais de fotos e vídeos, para Windows 11 e Linux. O app nunca modifica seus arquivos: ele constrói uma biblioteca lógica sobre eles.

**Stack:** Angular 22 + Optimus UI v2 + PrimeIcons · Tauri 2 + Rust 2024 · SQLite (WAL)

- Requisitos do produto: [docs/PRD.md](docs/PRD.md)
- Diagnóstico e plano de fases: [docs/PLANO.md](docs/PLANO.md)

## Pré-requisitos

- [Rust](https://rustup.rs/) stable
- Node.js 22+ e npm 10+
- Linux:
  ```bash
  sudo apt install build-essential pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev \
    librsvg2-dev patchelf
  ```
- Windows 11: o WebView2 já vem no sistema; é preciso o Visual Studio Build Tools (C++).

## Desenvolvimento

```bash
npm install
npm run tauri:dev        # Angular + backend
npm run tauri:build      # build de produção

cd src-tauri && cargo test
```

Para testar com um catálogo limpo: `PHOTOVAULT_HOME=/tmp/pv npm run tauri:dev`.

## Runtime portátil

Tudo fica ao lado do executável (ou do `.AppImage`):

```text
PhotoVault/
├── photovault(.exe)
├── data/catalog.db                    # catálogo SQLite (WAL)
├── thumbnails/<ab>/<photo-id>.webp    # miniaturas 256 px
└── logs/photovault.log.AAAA-MM-DD
```

## Estado atual (v0.2, Fase 0)

Funciona hoje:

- Criar e listar bibliotecas (várias)
- Scan recursivo com progresso, cancelamento e indexação incremental (por tamanho)
- Miniaturas WebP 256 px
- Galeria paginada, timeline por mês e visualizador com zoom e navegação

Ainda não funciona:

- Data EXIF (hoje é usada a data de modificação do arquivo)
- Duplicatas
- Vídeos (entram só no catálogo)
- O layout novo (vem na Fase 1)

Veja o [plano](docs/PLANO.md) para as próximas fases.

## Licença

Privado.
