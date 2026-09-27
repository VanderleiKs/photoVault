# PhotoVault

Aplicativo desktop portátil para organização de bibliotecas pessoais de fotos e vídeos.

**Stack**: Angular 22 + Tauri 2.x + Rust 2024 + SQLite (WAL mode)

---

## Pré-requisitos

### Rust
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Node.js
- Node.js 20+
- npm 10+

### Dependências do sistema (Linux)
```bash
sudo apt-get install libglib2.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf
```

---

## Desenvolvimento

### Instalar dependências
```bash
npm install --legacy-peer-deps
```

### Executar em desenvolvimento
```bash
npm run tauri:dev
```

### Build de produção
```bash
npm run tauri:build
```

---

## Estrutura do Projeto

```
organizador-fotos/
├── src/                      # Angular 22 frontend
│   ├── app/
│   │   ├── components/       # Componentes standalone
│   │   ├── services/         # Serviços (Tauri IPC)
│   │   └── models/           # Interfaces TypeScript
│   ├── assets/               # Assets estáticos
│   └── styles.css            # Tailwind v4
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── app/              # Estado global
│   │   ├── catalog/          # CRUD bibliotecas
│   │   ├── scanner/          # Discovery de arquivos
│   │   ├── metadata/         # Extração de metadados
│   │   ├── thumbnails/       # Geração de thumbnails
│   │   ├── filesystem/       # Operações de filesystem
│   │   └── commands/         # Comandos Tauri (IPC)
│   ├── migrations/           # SQLx migrations
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

---

## Runtime Portátil

Em produção, o PhotoVault cria a seguinte estrutura junto ao executável:

```
PhotoVault/
├── PhotoVault.exe
├── data/
│   └── catalog.db       # SQLite (WAL mode)
├── thumbnails/          # Thumbnails WebP 256x256
│   └── ab/
│       cd/
│           <photo-id>.webp
└── logs/
    └── photovault.log
```

---

## Funcionalidades (Fase 1 - Esqueleto)

- [x] Criar bibliotecas com pasta raiz
- [x] Scanner recursivo de arquivos de mídia
- [x] Indexação incremental (path + size + modified_time)
- [x] Banco SQLite com WAL mode
- [x] Geração de thumbnails 256x256 WebP
- [x] Galeria com grid responsivo
- [x] Sidebar com navegação
- [x] Progresso de scan em tempo real
- [x] Cancelamento de scan

---

## Próximas Fases

- **Fase 2**: Scanner completo (50k+ arquivos)
- **Fase 3**: Metadata EXIF completa
- **Fase 4**: Galeria avançada (virtualização, lazy loading)
- **Fase 5**: Detecção de duplicatas
- **Fase 6**: Análise de qualidade
- **Fase 7**: Eventos/viagens
- **Fase 8**: IA local (classificação)
- **Fase 9**: Organização física
- **Fase 10**: Backup verification

---

## Licença

Private
