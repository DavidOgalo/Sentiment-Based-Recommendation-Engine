# Sentiment-Based Recommendation Engine

A sentiment-based recommendation algorithm for service provider applications that leverages sentiment analysis and user preferences to provide personalized service recommendations. The project consists of a backend API built with FastAPI and a modern frontend interface built with Next.js.

## Project Overview

This project aims to provide a comprehensive solution for service discovery and recommendation, combining sentiment analysis of user reviews with personalized recommendations. The system helps users find the best services based on their preferences and helps service providers understand and improve their offerings.

## Tech Stack

- **Frontend**: Next.js
- **Backend**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: OpenAPI (Swagger UI)
- **NLP/ML**: Hugging Face Transformers (for BERT), VADER Sentiment, TensorFlow, Scikit-learn (for SMOTE and evaluation metrics)

## System Architecture

For a comprehensive overview of the system architecture, design rationale, integration points, and deployment reference, see [System Design Document](./system_design.md).

The project follows a microservices architecture with the following components:

1. **Frontend Application** (Next.js)
   - User interface for service discovery and management
   - Review system with sentiment visualization
   - Personalized recommendations
   - Authentication and authorization

2. **Backend API** (FastAPI)
   - RESTful API endpoints
   - Authentication and authorization
   - Sentiment analysis pipeline
   - Recommendation engine
   - Database management

3. **Database** (PostgreSQL)
   - User data
   - Service information
   - Reviews and ratings
   - Sentiment analysis results

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.8+ (for backend development)

### Running with Docker

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

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8001>
- API Documentation: <http://localhost:8001/docs>

## Detailed Documentation

For detailed information about each component, please refer to:

- [Frontend Documentation](../frontend/README.md)
  - Setup and development
  - Component structure
  - API integration
  - Deployment guide

- [Backend Documentation](../backend/README.md)
  - API endpoints
  - Authentication
  - Database schema
  - Development setup

## Key Features

### User Features

- User registration and authentication
- Service browsing and search
- Review submission and management
- Personalized service recommendations
- Provider verification system

### Provider Features

- Service management
- Review monitoring
- Performance analytics
- Verification status management

### Admin Features

- User management
- Provider verification
- System monitoring
- Content moderation

## Development Workflow

1. **Setup Development Environment**
   - Follow the setup instructions in the respective component READMEs
   - Set up environment variables
   - Install dependencies

2. **Development**
   - Frontend: `npm run dev` in the frontend directory
   - Backend: `uvicorn app.main:app --reload` in the backend directory

3. **Testing**
   - Frontend: `npm test`
   - Backend: `pytest`

4. **Deployment**
   - Follow the deployment instructions in the respective component READMEs
   - Use Docker for production deployment

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

- **Initial Approach**: VADER for fast, rule-based sentiment analysis on lexical features (e.g., word polarity, intensity modifiers).
- **Advanced Implementation**: Fine-tuned BERT model (using Hugging Face Transformers) specific to service reviews, employing supervised learning on labeled review data to capture contextual nuances (e.g., sarcasm, domain-specific sentiment).
- **Hybrid Approach**: Combining lexicon-based (VADER) and deep learning (BERT) methods for improved accuracy, with weighted averaging of scores to balance speed and precision.
- **Training and Evaluation**: Utilized supervised learning with a balanced dataset; addressed class imbalance through SMOTE oversampling and data augmentation (e.g., synonym replacement, back-translation). Evaluated using F1 score as the primary metric to handle imbalanced classes, achieving high precision/recall trade-off.

The sentiment pipeline will:

1. Preprocess text (remove stopwords, normalize, handle negations, tokenization via Hugging Face).
2. Extract linguistic features (adjectives, adverbs with high sentiment load).
3. Apply contextual analysis (service-specific terminology, embeddings from BERT).
4. Generate compound sentiment scores (-1 to 1).
5. Store results in the database.

#### Recommendation Engine Module

A hybrid recommendation system that combines:

1. Content-based filtering: Matching user preferences with service attributes.
2. Collaborative filtering: Finding patterns among similar users' preferences.
3. Sentiment-weighted ranking: Prioritizing services with positive sentiment scores.

Implementation Details

- Feature vector generation for each service provider including:
  - Average sentiment score (weighted by recency)
  - Categories and specializations
  - Geographic proximity
  - Response time and availability
- Matrix factorization using SVD for dimensionality reduction
- Real-time score adjustment based on new reviews
- **Evaluation**: Assessed recommendation quality using metrics like precision@K, with A/B testing in development to validate personalization effectiveness.

### 3. Data Layer

PostgreSQL database with a schema that supports:

- Detailed sentiment analysis storage
- Geographic querying for location-based recommendations
- Service categorization for better matching
- User preferences for personalized recommendations
- Interaction tracking for recommendation improvement

### 4. API Gateway

Comprehensive API layer using FastAPI with:

- RESTful endpoints
- OpenAPI documentation
- Rate limiting
- Request validation
- Error handling

### 5. Authentication and Authorization

OAuth2 with JWT (JSON Web Tokens) implementation:

- User registration and login
- Password hashing with bcrypt
- JWT token generation and validation
- Role-based access control (RBAC)
- Token refresh mechanism

## Implementation Strategy

### Version 1: MVP (Core Features) ✓

1. User management, authentication, and role-based access
2. Basic service provider listings and reviews
3. Enhanced sentiment analysis with VADER and fine-tuned BERT
4. Hybrid recommendation algorithm system

### Version 2: Optimization and Scaling

1. Advanced Recommendation model
2. Performance improvements and caching
3. Advanced analytics and reporting
4. Multi-language support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See the [LICENSE](../LICENSE) file for details.
