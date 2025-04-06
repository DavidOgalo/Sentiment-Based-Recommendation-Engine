# Sentiment-Based Recommendation Engine

A sentiment-based recommendation algorithm for service provider applications that leverages sentiment analysis and user preferences to provide personalized service recommendations. The project consists of a backend API built with FastAPI and a modern frontend interface built with Next.js.

## Project Structure

```
Sentiment-Based-Recommendation-Engine/
├── backend/                 # FastAPI backend application
│   ├── app/                # Application code
│   ├── alembic/            # Database migrations
│   ├── docs/               # Backend documentation
│   └── test_data/          # Test data
├── frontend/               # Next.js frontend application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── test_data/          # Test data
├── docker/                 # Docker configuration
│   ├── backend.Dockerfile  # Backend Dockerfile
│   ├── frontend.Dockerfile # Frontend Dockerfile
│   └── docker-compose.yml  # Docker Compose configuration
└── docs/                   # Project documentation
    └── README.md           # This file
```

## Features

### Backend
- RESTful API with OpenAPI documentation
- JWT-based authentication
- Role-based access control
- Sentiment analysis pipeline
- Recommendation engine
- Database migrations with Alembic
- Docker support
- Comprehensive test suite

### Frontend
- Modern, responsive UI with Tailwind CSS
- User authentication and authorization
- Service browsing and search
- Review system with sentiment analysis
- Personalized recommendations
- Dark/Light mode support

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.8+ (for backend development)
- PostgreSQL 15+

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/DavidOgalo/Sentiment-Based-Recommendation-Engine.git
cd Sentiment-Based-Recommendation-Engine
```

2. Start the application:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

3. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

### Development Setup

For detailed setup instructions, see:
- [Backend Development Guide](backend/README.md)
- [Frontend Development Guide](frontend/README.md)

## Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Documentation](http://localhost:8001/docs)
- [Database Schema](backend/docs/schema.sql)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## System Architecture Overview
### 1. Core Backend Services
Python-based microservices handling specific business logic.

#### User Management Service
- Handles user registration, profile management
- Role-based access (Customer, Service Provider, Super-Admin)
- User preferences and settings

#### Review Service
- Processes and stores customer reviews and ratings
- Triggers sentiment analysis pipeline
- Manages review lifecycle (submission, moderation if needed, updates)

#### Service Provider Management
- Service provider profiles and service offerings
- Analytics dashboard data for service providers
- Performance metrics and reporting


### 2. ML Pipeline
Sentiment analysis and recommendation engine.
#### Sentiment Analysis Module
Implementation Details
- Initial Approach: VADER for fast, rule-based sentiment analysis
- Advanced Implementation: Fine-tuned BERT model specific to service reviews
- Hybrid Approach: Combining lexicon-based and deep learning methods for better accuracy

The sentiment pipeline will:

1. Preprocess text (remove stopwords, normalize, handle negations)
2. Extract linguistic features (adjectives, adverbs with high sentiment load)
3. Apply contextual analysis (service-specific terminology)
4. Generate compound sentiment scores (-1 to 1)
5. Store results in the database

#### Recommendation Engine Module
I used a hybrid recommendation system that combines:
1. Content-based filtering: Matching user preferences with service attributes
2. Collaborative filtering: Finding patterns among similar users' preferences
3. Sentiment-weighted ranking: Prioritizing services with positive sentiment scores

Implementation Details
- Feature vector generation for each service provider including:
Average sentiment score (weighted by recency), Categories and specializations, Geographic proximity, Response time and availability
- Matrix factorization using SVD for dimensionality reduction
- User similarity computation using cosine similarity
- Real-time score adjustment based on new reviews

### 3. Data Layer
Set up a PostgreSQL instance with a schema that supports:
- Detailed sentiment analysis storage
- Geographic querying for location-based recommendations
- Service categorization for better matching
- User preferences for personalized recommendations
- Interaction tracking for recommendation improvement

### 4. API Gateway
Implemented a comprehensive API layer using FastAPI

### 5. Authentication and Authorization
#### Approach
 Used OAuth2 with JWT (JSON Web Tokens) for authentication, which is secure and scalable. FastAPI has built-in support for OAuth2.

#### Implementation
**1. User Registration & Login**

- `/auth/register` → To register users.
- `/auth/login` → To authenticate users and return JWT tokens.

**2. Password Hashing**

- Used **`bcrypt`** to hash passwords securely.

**3. JWT Token Generation**

- Generate **access tokens** using **PyJWT**.

**4. Role-Based Access Control (RBAC)**

- Define roles: **customer, service provider, admin**.
- Use **JWT token claims** to store user roles.

### 6. Infrastructure and Deployment
Defined a Docker setup for the application

### 7. Implementation Strategy 
Took on a phased approach

#### Phase 1: MVP (Core Features) - Version 0.1 ✓

1. User management, authentication, and role-based access
2. Basic service provider listings and reviews
3. Simple sentiment analysis using VADER
4. Basic recommendation algorithm

#### Phase 2: Advanced Features - Future Updates/Version
1. Enhanced sentiment analysis with fine-tuned BERT
2. Hybrid recommendation system
3. Service booking functionality
4. Provider analytics dashboard

#### Phase 3: Optimization and Scaling - Future Updates/Version

1. Performance improvements and caching
2. Advanced analytics and reporting
3. Mobile app support via enhanced API
4. Multi-language support

## Application Features
- User Authentication and Authorization (JWT-based)
- Service Provider Management
- Service Categories and Services Management
- Review System with Sentiment Analysis
- Personalized Service Recommendations
- User Preferences Management
- Booking System
- Provider Verification System

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: OpenAPI (Swagger UI)

## Prerequisites

- Docker and Docker Compose
- Python 3.8+
- PostgreSQL 15+

## Project Structure

```
Root/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── schemas/
│   ├── alembic/
│   └── tests/
├── docker/
└── test_data/
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/DavidOgalo/Sentiment-Based-Recommendation-Engine.git
cd Sentiment-Based-Recommendation-Engine
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the application using Docker Compose:
```bash
docker-compose up -d
```

4. Access the API documentation:
```
http://localhost:8001/docs
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user and get access token
- `POST /auth/verify-email` - Verify user email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `GET /users/{user_id}` - Get user profile by ID
- `PUT /users/{user_id}` - Update user profile by ID
- `DELETE /users/{user_id}` - Delete user (admin only)

### Service Providers
- `POST /providers/` - Create provider profile
- `GET /providers/` - List all providers
- `GET /providers/{provider_id}` - Get provider details
- `PUT /providers/{provider_id}` - Update provider profile
- `POST /providers/{provider_id}/verify` - Verify provider (admin only)

### Services
- `POST /services/` - Create new service
- `GET /services/` - List all services
- `GET /services/{service_id}` - Get service details
- `PUT /services/{service_id}` - Update service
- `DELETE /services/{service_id}` - Delete service

### Categories
- `POST /categories/` - Create service category
- `GET /categories/` - List all categories
- `GET /categories/{category_id}` - Get category details
- `PUT /categories/{category_id}` - Update category
- `DELETE /categories/{category_id}` - Delete category

### Reviews
- `POST /reviews/` - Create new review
- `GET /reviews/` - List all reviews
- `GET /reviews/{review_id}` - Get review details
- `PUT /reviews/{review_id}` - Update review
- `DELETE /reviews/{review_id}` - Delete review

### Recommendations
- `GET /recommendations/` - Get personalized recommendations
- `GET /recommendations/trending` - Get trending services
- `POST /recommendations/{recommendation_id}/click` - Record recommendation click
- `POST /recommendations/{recommendation_id}/book` - Record recommendation booking

### User Preferences
- `POST /preferences/` - Create user preferences
- `GET /preferences/` - Get user preferences
- `PUT /preferences/` - Update user preferences

### Bookings
- `POST /bookings/` - Create new booking
- `GET /bookings/` - List all bookings
- `GET /bookings/{booking_id}` - Get booking details
- `PUT /bookings/{booking_id}` - Update booking status
- `DELETE /bookings/{booking_id}` - Cancel booking

## Database Schema

The application uses PostgreSQL with the following main tables:
- users
- service_providers
- services
- service_categories
- reviews
- review_sentiment_details
- recommendations
- user_preferences
- user_interactions
- bookings

For detailed schema information, see `database-schema.sql`

## Testing

1. Run tests using Docker:
```bash
docker-compose run backend pytest
```

2. Run test data population:
```bash
python test_data/populate_test_data.py
```

## Development

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request



