# AIMA Learning Management System (LMS)

A modern, scalable Learning Management System built with Next.js and Nest.js.

## Tech Stack

### Frontend
- React 18 with Next.js 14
- TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Hook Form for form handling
- Zod for schema validation

### Backend
- Nest.js with TypeScript
- PostgreSQL for primary database
- Firestore for real-time features
- Google Cloud Storage for file storage
- JWT + Google Identity Platform for authentication

### Infrastructure
- Docker & Docker Compose
- Google Cloud                                                       Platform (GCP)
- Cloud Run for deployment
- Cloud Storage for media
- Cloud SQL for PostgreSQL

## Project Structure

```
aimaLMS/
├── frontend/           # Next.js frontend application
├── backend/           # Nest.js backend application
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration files
└── docs/             # Project documentation
```

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Google Cloud SDK
- PostgreSQL 15+
- pnpm (recommended) or npm

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aimaLMS.git
   cd aimaLMS
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   pnpm install

   # Install backend dependencies
   cd ../backend
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env.local

   # Backend
   cp backend/.env.example backend/.env
   ```

4. Start development servers:
   ```bash
   # Frontend (http://localhost:3000)
   cd frontend
   pnpm dev

   # Backend (http://localhost:4000)
   cd backend
   pnpm start:dev
   ```

5. For Docker development:
   ```bash
   docker-compose up
   ```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/aima_lms
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
JWT_SECRET=your_jwt_secret
STORAGE_BUCKET=your_gcp_bucket
```

## Features

- 🔐 Secure authentication with Google Identity Platform
- 👩‍🏫 Comprehensive instructor management
  - Profile management with photo uploads
  - Start date tracking
  - Course assignments
- 📚 Course management and enrollment
- 📝 Assignment creation and submission
- 📊 Progress tracking and analytics
- 💬 Real-time discussions and notifications
- 📱 Responsive design for all devices
- 🎥 Video content streaming
- 📄 Document management
- 📈 Analytics dashboard

## Development Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Write tests for new features
- Update documentation when making changes
- Follow the established code style and linting rules

## Testing

```bash
# Run frontend tests
cd frontend
pnpm test

# Run backend tests
cd backend
pnpm test
```

## Deployment

1. Build Docker images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Deploy to GCP Cloud Run:
   ```bash
   # Deploy backend
   gcloud run deploy aima-lms-backend --source backend/

   # Deploy frontend
   gcloud run deploy aima-lms-frontend --source frontend/
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 