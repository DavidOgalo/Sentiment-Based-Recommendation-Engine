# Backend API

The backend API for the Sentiment-Based Recommendation Engine, built with FastAPI, PostgreSQL, and Docker.

## Features

- RESTful API with OpenAPI documentation
- JWT-based authentication
- Role-based access control
- Sentiment analysis pipeline
- Recommendation engine
- Database migrations with Alembic
- Docker support
- Comprehensive test suite

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT
- **Containerization**: Docker
- **API Documentation**: OpenAPI (Swagger UI)
- **Testing**: pytest
- **Code Quality**: black, isort, flake8

## Project Structure

```
backend/
├── app/
│   ├── api/           # API endpoints and routers
│   ├── core/          # Core functionality (config, security)
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   └── services/      # Business logic
├── alembic/           # Database migrations
├── docs/              # Documentation
│   └── schema.sql     # Database schema
├── tests/             # Test suite
└── test_data/         # Test data
```

## Getting Started

1. Set up the environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the database:
```bash
docker-compose -f ../docker/docker-compose.yml up -d db
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

6. Access the API documentation:
```
http://localhost:8000/docs
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
- `API_V1_STR`: API version prefix

## Development

- Run development server: `uvicorn app.main:app --reload`
- Run tests: `pytest`
- Run linter: `flake8`
- Format code: `black . && isort .`
- Generate migrations: `alembic revision --autogenerate -m "description"`

## API Documentation

The API documentation is available at `/docs` when running the server. It includes:
- Interactive API testing
- Request/response schemas
- Authentication requirements
- Example requests

## Database Migrations

Database migrations are managed using Alembic. To create a new migration:

1. Make changes to the SQLAlchemy models
2. Generate a migration:
```bash
alembic revision --autogenerate -m "description"
```
3. Apply the migration:
```bash
alembic upgrade head
```

## Testing

The test suite uses pytest. To run tests:

```bash
pytest
```

For coverage report:
```bash
pytest --cov=app tests/
```

## Deployment

The backend can be deployed using Docker:

```bash
docker-compose -f ../docker/docker-compose.yml up -d
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linter
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 