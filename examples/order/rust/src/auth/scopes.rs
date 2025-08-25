use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
};
use async_trait::async_trait;

use crate::{
    auth::Claims,
    common::errors::{Problem, AppError},
};

pub struct Scopes(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for Scopes
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        if let Some(claims) = parts.extensions.get::<Claims>() {
            Ok(Scopes(claims.clone()))
        } else {
            let problem = Problem::unauthorized("Missing authentication");
            Err((
                StatusCode::UNAUTHORIZED,
                serde_json::to_string(&problem).unwrap(),
            ).into_response())
        }
    }
}

pub struct RequireScopes<const N: usize> {
    required_scopes: [&'static str; N],
}

impl<const N: usize> RequireScopes<N> {
    pub fn new(required_scopes: [&'static str; N]) -> Self {
        Self { required_scopes }
    }

    pub fn check(&self, claims: &Claims) -> Result<(), AppError> {
        for scope in &self.required_scopes {
            if !claims.has_scope(scope) {
                return Err(AppError::ForbiddenWithMessage(
                    format!("Missing required scope: {}", scope)
                ));
            }
        }
        Ok(())
    }
}
