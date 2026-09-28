use serde::Serialize;
use specta::Type;

/// Error returned by every command: stable `code` + pt-BR `message`.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

impl From<photovault_core::Error> for ApiError {
    fn from(e: photovault_core::Error) -> Self {
        match &e {
            photovault_core::Error::Database(_)
            | photovault_core::Error::Migration(_)
            | photovault_core::Error::Io(_)
            | photovault_core::Error::Internal(_) => tracing::error!("{e}"),
            _ => tracing::debug!("{e}"),
        }
        ApiError {
            code: e.code().to_string(),
            message: e.to_string(),
        }
    }
}

impl ApiError {
    pub fn internal(message: impl Into<String>) -> Self {
        ApiError {
            code: "INTERNAL".into(),
            message: message.into(),
        }
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
