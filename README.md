# Ships

A full-stack application built with React, TypeScript, Vite, Hono, tRPC, and Drizzle ORM.

## Project Structure

- `/frontend` - React/Vite frontend application
- `/backend` - Hono/tRPC backend server with Drizzle ORM
- `/packages` - Shared packages (if any)

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- ESBuild (for fast builds)

### Backend
- Hono (lightweight web framework)
- tRPC (end-to-end typesafe APIs)
- Drizzle ORM (TypeScript ORM)
- MySQL2 (database)
- AWS S3 (file storage)
- JWT authentication (jose library)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MySQL database
- AWS account (for S3 storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ships
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure database connection
   - Configure AWS credentials (if using S3)

4. Initialize the database:
```bash
cd backend
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
# or
npm run db:push      # Push schema directly
```

5. Start the development servers:
```bash
# In one terminal - start backend
cd backend
npm run dev

# In another terminal - start frontend
cd frontend
npm run dev
```

## Available Scripts

### Frontend (`/frontend`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run check` - Run TypeScript checker

### Backend (`/backend`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript checker
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database

## API Documentation

Once the backend is running, visit `http://localhost:PORT` (default port is usually 3000) to access the API documentation.

## License

MIT