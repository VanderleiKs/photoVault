//! Core error type. Every variant has a stable machine-readable `code`
//! and a user-facing message in pt-BR.

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Biblioteca não encontrada.")]
    LibraryNotFound,

    #[error("Mídia não encontrada.")]
    MediaNotFound,

    #[error("Álbum não encontrado.")]
    AlbumNotFound,

    #[error("Pessoa não encontrada.")]
    PersonNotFound,

    #[error("A pasta não existe ou não está acessível: {0}")]
    PathNotAccessible(String),

    #[error("{0}")]
    InvalidInput(String),

    #[error("Já existe um scan em andamento.")]
    ScanInProgress,

    #[error("A pasta escolhida não parece conter as fotos desta biblioteca.")]
    RelocationMismatch,

    #[error("Erro no banco de dados: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Erro ao atualizar o banco de dados: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),

    #[error("Erro de leitura/gravação: {0}")]
    Io(#[from] std::io::Error),

    /// Local AI (phase 7): models missing, corrupt or failing.
    #[error("IA local: {0}")]
    Ai(String),

    #[error("{0}")]
    Internal(String),
}

impl Error {
    /// Stable identifier the frontend can branch on.
    pub fn code(&self) -> &'static str {
        match self {
            Error::LibraryNotFound => "LIBRARY_NOT_FOUND",
            Error::MediaNotFound => "MEDIA_NOT_FOUND",
            Error::AlbumNotFound => "ALBUM_NOT_FOUND",
            Error::PersonNotFound => "PERSON_NOT_FOUND",
            Error::PathNotAccessible(_) => "PATH_NOT_ACCESSIBLE",
            Error::InvalidInput(_) => "INVALID_INPUT",
            Error::ScanInProgress => "SCAN_IN_PROGRESS",
            Error::RelocationMismatch => "RELOCATION_MISMATCH",
            Error::Database(_) => "DATABASE",
            Error::Migration(_) => "MIGRATION",
            Error::Io(_) => "IO",
            Error::Ai(_) => "AI",
            Error::Internal(_) => "INTERNAL",
        }
    }
}

impl From<ort::Error> for Error {
    fn from(e: ort::Error) -> Self {
        Error::Ai(e.to_string())
    }
}

impl From<tokio::task::JoinError> for Error {
    fn from(e: tokio::task::JoinError) -> Self {
        Error::Internal(format!("Tarefa interrompida: {e}"))
    }
}
