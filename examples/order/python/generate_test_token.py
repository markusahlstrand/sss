#!/usr/bin/env python3

import os
import sys
from datetime import datetime, timedelta
from jose import jwt

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"

def generate_test_token(scopes=None, sub="test-user", exp_hours=24):
    """Generate a test JWT token with the specified scopes."""
    
    if scopes is None:
        scopes = ["orders.read", "orders.write"]
    
    payload = {
        "sub": sub,
        "scopes": scopes,
        "exp": datetime.utcnow() + timedelta(hours=exp_hours),
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate test JWT tokens")
    parser.add_argument("--scopes", nargs="+", default=["orders.read", "orders.write"],
                       help="Scopes to include in the token")
    parser.add_argument("--sub", default="test-user", help="Subject (user ID)")
    parser.add_argument("--exp-hours", type=int, default=24, help="Token expiration hours")
    
    args = parser.parse_args()
    
    token = generate_test_token(
        scopes=args.scopes,
        sub=args.sub, 
        exp_hours=args.exp_hours
    )
    
    print("Generated JWT token:")
    print(token)
    print()
    print("Example usage:")
    print(f'curl -H "Authorization: Bearer {token}" http://localhost:8000/orders')
    print()
    print("Token payload:")
    decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    for key, value in decoded.items():
        if key == "exp" or key == "iat":
            print(f"  {key}: {datetime.fromtimestamp(value)} ({value})")
        else:
            print(f"  {key}: {value}")
