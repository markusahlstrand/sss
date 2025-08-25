use axum::{
    extract::Request,
    http::{header::AUTHORIZATION, StatusCode},
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use tower::{Layer, Service};

pub mod scopes;

use crate::common::errors::Problem;
pub use scopes::{RequireScopes, Scopes};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub scopes: Vec<String>,
}

impl Claims {
    pub fn has_scope(&self, required_scope: &str) -> bool {
        self.scopes.contains(&required_scope.to_string())
    }

    pub fn has_any_scope(&self, required_scopes: &[&str]) -> bool {
        required_scopes.iter().any(|scope| self.has_scope(scope))
    }
}

#[derive(Clone)]
pub struct AuthLayer {
    jwt_secret: String,
}

impl AuthLayer {
    pub fn new(jwt_secret: String) -> Self {
        Self { jwt_secret }
    }
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthService {
            inner,
            jwt_secret: self.jwt_secret.clone(),
        }
    }
}

#[derive(Clone)]
pub struct AuthService<S> {
    inner: S,
    jwt_secret: String,
}

impl<S> Service<Request> for AuthService<S>
where
    S: Service<Request, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = std::pin::Pin<Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut request: Request) -> Self::Future {
        let jwt_secret = self.jwt_secret.clone();
        let mut inner = self.inner.clone();

        Box::pin(async move {
            // Skip auth for health endpoints and service info
            let path = request.uri().path();
            if path == "/healthz" || path == "/readyz" || path == "/" || path == "/openapi.json" || path.starts_with("/swagger-ui") {
                return inner.call(request).await;
            }

            // Extract and validate JWT token
            if let Some(auth_header) = request.headers().get(AUTHORIZATION) {
                if let Ok(auth_str) = auth_header.to_str() {
                    if let Some(token) = auth_str.strip_prefix("Bearer ") {
                        match decode::<Claims>(
                            token,
                            &DecodingKey::from_secret(jwt_secret.as_ref()),
                            &Validation::new(Algorithm::HS256),
                        ) {
                            Ok(token_data) => {
                                request.extensions_mut().insert(token_data.claims);
                                return inner.call(request).await;
                            }
                            Err(_) => {
                                let problem = Problem::unauthorized("Invalid token");
                                let response = Response::builder()
                                    .status(StatusCode::UNAUTHORIZED)
                                    .header("content-type", "application/problem+json")
                                    .body(serde_json::to_string(&problem).unwrap().into())
                                    .unwrap();
                                return Ok(response);
                            }
                        }
                    }
                }
            }

            let problem = Problem::unauthorized("Missing or invalid authorization header");
            let response = Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("content-type", "application/problem+json")
                .body(serde_json::to_string(&problem).unwrap().into())
                .unwrap();
            Ok(response)
        })
    }
}
