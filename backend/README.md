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

## API Endpoints

### Authentication Module
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user and get access token
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify user email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### User Management Module
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `GET /users/{user_id}` - Get user profile by ID (admin only)
- `PUT /users/{user_id}` - Update user profile by ID (admin only)
- `DELETE /users/{user_id}` - Delete user (admin only)

### Service Provider Module
- `POST /providers/` - Create provider profile
- `GET /providers/` - List all providers
- `GET /providers/{provider_id}` - Get provider details
- `PUT /providers/{provider_id}` - Update provider profile
- `POST /providers/{provider_id}/verify` - Verify provider (admin only)
- `DELETE /providers/{provider_id}` - Delete provider (admin only)

### Services Module
- `POST /services/` - Create new service
- `GET /services/` - List all services
- `GET /services/{service_id}` - Get service details
- `PUT /services/{service_id}` - Update service
- `DELETE /services/{service_id}` - Delete service
- `GET /services/categories/{category_id}` - List services by category

### Categories Module
- `POST /categories/` - Create service category (admin only)
- `GET /categories/` - List all categories
- `GET /categories/{category_id}` - Get category details
- `PUT /categories/{category_id}` - Update category (admin only)
- `DELETE /categories/{category_id}` - Delete category (admin only)

### Reviews Module
- `POST /reviews/` - Create new review
- `GET /reviews/` - List all reviews
- `GET /reviews/{review_id}` - Get review details
- `PUT /reviews/{review_id}` - Update review
- `DELETE /reviews/{review_id}` - Delete review
- `GET /reviews/service/{service_id}` - List reviews for a service
- `GET /reviews/user/{user_id}` - List reviews by a user

### Sentiment Analysis Module
- `POST /sentiment/analyze` - Analyze text sentiment
- `GET /sentiment/service/{service_id}` - Get sentiment analysis for a service
- `GET /sentiment/provider/{provider_id}` - Get sentiment analysis for a provider

### Recommendations Module
- `GET /recommendations/` - Get personalized recommendations
- `GET /recommendations/trending` - Get trending services
- `GET /recommendations/category/{category_id}` - Get category-specific recommendations
- `POST /recommendations/feedback` - Submit recommendation feedback

### User Preferences Module
- `POST /preferences/` - Create user preferences
- `GET /preferences/` - Get user preferences
- `PUT /preferences/` - Update user preferences
- `DELETE /preferences/` - Delete user preferences

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
- `SENTIMENT_MODEL_PATH`: Path to sentiment analysis model
- `RECOMMENDATION_MODEL_PATH`: Path to recommendation model

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
- Example requests and responses

## Testing

1. Run unit tests:
```bash
pytest
```

2. Run integration tests:
```bash
pytest tests/integration
```

3. Run with coverage:
```bash
pytest --cov=app tests/
```

## Contributing

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Description of your changes"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 