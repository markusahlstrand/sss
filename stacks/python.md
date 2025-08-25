# Python

✅ Flexible, good for ML/data-heavy services, or quick iterations.

## FastAPI ⭐ RECOMMENDED

- **First-class OpenAPI support** (built-in automatic generation)
- **Simple OAuth2 integration** with dependency injection
- **Async support** for event-driven apps
- **Pydantic integration** for strict JSON Schema validation
- **Logging & OpenTelemetry** well supported
- **Excellent developer experience** with type hints and auto-documentation

### Key Implementation Notes

- **Python Version**: Use Python 3.12 or 3.11 for best package compatibility
  - Python 3.13 is very new and may require compilation for some dependencies
- **Import Structure**: Use absolute imports for direct script execution
- **Dependencies**: Core packages work well together:
  - `fastapi`, `uvicorn[standard]`, `pydantic`
  - `python-jose[cryptography]` for JWT
  - `structlog` for structured logging
  - OpenTelemetry packages for observability
  - `cloudevents` for event publishing

### Common Pitfalls to Avoid

- **Virtual Environment Issues**: Ensure Python version matches between venv creation and execution
- **Relative Imports**: Use absolute imports in main.py for direct execution
- **Package Compilation**: If getting `pydantic-core` build errors, try:
  - Using Python 3.12 instead of 3.13
  - `pip install --only-binary=:all: -r requirements.txt`
  - Or use pre-built wheel versions

## Django REST Framework

- More heavyweight, great for CRUD-heavy apps
- Better suited if you also need ORM + admin panel
