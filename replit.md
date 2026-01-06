# Face Recognition Attendance System

## Overview

A web application for tracking attendance using facial recognition technology. The system allows administrators to register people by capturing face samples via webcam or image upload, then recognizes those faces during attendance check-in. Built with a React frontend and Express/Node.js backend, using PostgreSQL for data persistence.

Key features:
- Person registration with face sample capture (webcam or upload)
- Real-time facial recognition for attendance marking
- Attendance logs with filtering and CSV export
- People management (view, delete registered individuals)
- Dashboard with quick stats and recent activity
- Light/dark theme support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based structure with shared components. Pages include Home (dashboard), Register, Attendance, Logs, and People management. Custom components handle webcam capture and image upload functionality.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **HTTP Server**: Node.js HTTP server (supports potential WebSocket integration)
- **API Design**: RESTful JSON API under `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL

The server handles face embedding storage and matching. Recognition uses cosine distance similarity with a configurable threshold. A 5-minute cooldown prevents duplicate attendance records for the same person.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: Two main tables - `people` (stores person info and face embeddings) and `attendance` (attendance records)
- **Embeddings**: Stored as JSON text in the database

### Key Design Decisions

**Face Recognition Pipeline**: The system uses face-api.js for real-time face detection and embedding extraction in the browser. When registering a person, the client captures multiple face samples, extracts 128-dimensional face embeddings using TensorFlow.js-based neural networks, and sends only the embeddings to the server. During attendance check, the client detects faces, extracts embeddings, and the server performs cosine similarity matching against stored embeddings. Models are loaded from a CDN (https://justadudewhohacks.github.io/face-api.js/models) for efficient delivery.

**Dual Input Methods**: Both webcam capture and image upload are supported for flexibility across devices and use cases.

**Attendance Cooldown**: 5-minute configurable window prevents marking the same person multiple times in quick succession.

## External Dependencies

### Face Recognition
- **face-api.js**: Browser-based face detection and recognition library built on TensorFlow.js
- **Models**: tinyFaceDetector (face detection), faceLandmark68Net (facial landmarks), faceRecognitionNet (128-dim embeddings)
- **CDN**: Models loaded from justadudewhohacks.github.io (cached by browser after first load)

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries
- **drizzle-kit**: Database migrations (`npm run db:push`)

### UI Libraries
- **Radix UI**: Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **react-day-picker**: Calendar component

### Forms & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation (shared between client and server via drizzle-zod)

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator