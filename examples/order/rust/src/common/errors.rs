use axum::{
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use utoipa::ToSchema;
use validator::ValidationErrors;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Validation error: {0}")]
    Validation(#[from] ValidationErrors),
    
    #[error("Order not found")]
    OrderNotFound,
    
    #[error("Order conflict: {0}")]
    OrderConflict(String),
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Forbidden")]
    Forbidden,
    
    #[error("Forbidden: {0}")]
    ForbiddenWithMessage(String),
    
    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let problem = match &self {
            AppError::Validation(errors) => {
                let detail = format_validation_errors(errors);
                Problem {
                    problem_type: "validation_error".to_string(),
                    title: "Validation Error".to_string(),
                    status: 400,
                    detail: Some(detail),
                    instance: None,
                }
            }
            AppError::OrderNotFound => Problem {
                problem_type: "not_found".to_string(),
                title: "Not Found".to_string(),
                status: 404,
                detail: Some("Order not found".to_string()),
                instance: None,
            },
            AppError::OrderConflict(msg) => Problem {
                problem_type: "conflict".to_string(),
                title: "Conflict".to_string(),
                status: 409,
                detail: Some(msg.clone()),
                instance: None,
            },
            AppError::Unauthorized => Problem {
                problem_type: "unauthorized".to_string(),
                title: "Unauthorized".to_string(),
                status: 401,
                detail: None,
                instance: None,
            },
            AppError::Forbidden => Problem {
                problem_type: "forbidden".to_string(),
                title: "Forbidden".to_string(),
                status: 403,
                detail: None,
                instance: None,
            },
            AppError::ForbiddenWithMessage(msg) => Problem {
                problem_type: "forbidden".to_string(),
                title: "Forbidden".to_string(),
                status: 403,
                detail: Some(msg.clone()),
                instance: None,
            },
            AppError::Internal(_) => Problem {
                problem_type: "internal_error".to_string(),
                title: "Internal Server Error".to_string(),
                status: 500,
                detail: None,
                instance: None,
            },
        };

        let status_code = StatusCode::from_u16(problem.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        
        (status_code, Json(problem)).into_response()
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Problem {
    #[serde(rename = "type")]
    pub problem_type: String,
    pub title: String,
    pub status: u16,
    pub detail: Option<String>,
    pub instance: Option<String>,
}

impl Problem {
    pub fn validation_error(detail: &str) -> Self {
        Self {
            problem_type: "validation_error".to_string(),
            title: "Validation Error".to_string(),
            status: 400,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }

    pub fn not_found(detail: &str) -> Self {
        Self {
            problem_type: "not_found".to_string(),
            title: "Not Found".to_string(),
            status: 404,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }

    pub fn conflict(detail: &str) -> Self {
        Self {
            problem_type: "conflict".to_string(),
            title: "Conflict".to_string(),
            status: 409,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }

    pub fn unauthorized(detail: &str) -> Self {
        Self {
            problem_type: "unauthorized".to_string(),
            title: "Unauthorized".to_string(),
            status: 401,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }

    pub fn forbidden(detail: &str) -> Self {
        Self {
            problem_type: "forbidden".to_string(),
            title: "Forbidden".to_string(),
            status: 403,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }

    pub fn internal_error(detail: &str) -> Self {
        Self {
            problem_type: "internal_error".to_string(),
            title: "Internal Server Error".to_string(),
            status: 500,
            detail: Some(detail.to_string()),
            instance: None,
        }
    }
}

fn format_validation_errors(errors: &ValidationErrors) -> String {
    let mut messages = Vec::new();
    
    for (field, field_errors) in errors.field_errors() {
        for error in field_errors {
            let message = error.message.as_ref()
                .map(|m| m.to_string())
                .unwrap_or_else(|| format!("{} validation failed", field));
            messages.push(message);
        }
    }
    
    messages.join(", ")
}
