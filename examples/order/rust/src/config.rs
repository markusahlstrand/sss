use anyhow::Result;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub jwt_secret: String,
    pub jaeger_endpoint: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key".to_string()),
            jaeger_endpoint: env::var("JAEGER_ENDPOINT").ok(),
        })
    }
}
