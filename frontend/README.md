# Frontend Application

A modern web interface for the Sentiment-Based Recommendation Engine, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- User Authentication (Login/Register)
- Service Browsing and Search
- Service Provider Management
- Review System with Sentiment Analysis
- Personalized Service Recommendations
- Responsive Design
- Dark/Light Mode Support

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **UI Components**: Custom components with Tailwind CSS
- **Authentication**: JWT-based with refresh tokens

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and API clients
│   ├── pages/          # Next.js pages and API routes
│   ├── styles/         # Global styles and Tailwind config
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
└── test_data/          # Test data for development
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_APP_URL`: Frontend application URL

## Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Run tests: `npm test`
- Run linter: `npm run lint`
- Run type checker: `npm run type-check`

## Deployment

The frontend can be deployed to any platform that supports Next.js applications, such as:
- Vercel
- Netlify
- AWS Amplify
- Docker container

## API Integration

The frontend communicates with the backend through RESTful APIs. All API calls are handled through the `lib/api.ts` file, which provides typed methods for interacting with the backend services.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linter
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 