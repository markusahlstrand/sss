use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Serialize};

#[derive(Debug, Serialize)]
struct Claims {
    sub: String,
    exp: usize,
    scopes: Vec<String>,
}

fn main() {
    let claims = Claims {
        sub: "test-user".to_string(),
        exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
        scopes: vec![
            "orders.read".to_string(),
            "orders.write".to_string()
        ],
    };

    match encode(&Header::default(), &claims, &EncodingKey::from_secret("your-secret-key".as_ref())) {
        Ok(token) => {
            println!("Generated JWT Token:");
            println!("{}", token);
            println!("\nUse this token in the Authorization header:");
            println!("Authorization: Bearer {}", token);
            println!("\nToken expires in 24 hours.");
        }
        Err(err) => {
            eprintln!("Error generating token: {}", err);
            std::process::exit(1);
        }
    }
}
