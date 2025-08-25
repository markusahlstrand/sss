# Troubleshooting Build Issues

This document provides solutions for common build issues when installing the Python Orders Service.

## Problem: ModuleNotFoundError for fastapi, pydantic, etc.

If you get errors like `ModuleNotFoundError: No module named 'fastapi'`, you need to install the dependencies:

```bash
# Make sure your virtual environment is activated
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Problem: pydantic-core compilation error

### Quick Solutions (try in order):

### 1. Use pre-built wheels requirements

```bash
pip install -r requirements-prebuilt.txt
```

### 2. Force use of binary wheels (no compilation)

```bash
pip install --only-binary=:all: -r requirements.txt
```

### 3. Use conda instead of pip

```bash
# Install conda/mamba if you haven't already
conda install -c conda-forge fastapi uvicorn pydantic python-jose structlog opentelemetry-api opentelemetry-sdk pytest httpx python-dotenv
```

### 4. Install Rust toolchain (if you need to compile)

```bash
# On macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Then retry pip install
pip install -r requirements.txt
```

### 5. Use Python 3.11 or 3.12 instead of 3.13 ✅ RECOMMENDED

Python 3.13 is very new and may not have pre-built wheels for all packages.
**This is often the most reliable solution.**

```bash
# If using pyenv
pyenv install 3.12.7
pyenv local 3.12.7

# Create new venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Note**: Some users have reported success with Python 3.13 after downgrading and re-creating the virtual environment.

### 6. Use Docker (completely isolated)

```bash
# Build and run with Docker - no local Python needed
docker-compose up --build
```

## Alternative: Minimal FastAPI setup

If you're still having issues, you can start with a minimal setup:

```bash
pip install fastapi uvicorn python-jose structlog pytest httpx python-dotenv PyYAML
```

Then gradually add other dependencies as needed.

## Platform-specific notes:

### macOS with Apple Silicon (M1/M2/M3)

```bash
# May need to install additional tools
brew install rust
# or
conda install rust
```

### Linux

```bash
# Install build tools
sudo apt-get update
sudo apt-get install build-essential libssl-dev libffi-dev python3-dev
# or on CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install openssl-devel libffi-devel python3-devel
```

## Recommended approach:

1. Try option #2 first (force binary wheels)
2. If that fails, use Docker (#6)
3. If you need local development, try conda (#3) or Python 3.12 (#5)

The service will work with any of these approaches!
