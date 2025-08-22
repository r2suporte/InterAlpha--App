# InterAlpha Project Context for Qwen Code

## Project Overview

This is the **InterAlpha--App**, a complete enterprise management system with advanced integrations. It's a full-stack web application built with modern technologies.

### Core Functionality
- **Authentication** - Complete login and registration system using Clerk
- **Customer Management** - Full CRUD for clients
- **Service Orders** - Service management control
- **Payments** - Integrated financial management
- **Integrations** - WhatsApp, SMS, Email
- **Dashboard** - Reports and analytics
- **Workflows** - Process automation

### Technology Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe
- **Messaging**: WhatsApp Business API, Twilio for SMS
- **Other Key Libraries**: 
  - UI Components: Radix UI, Lucide React Icons
  - Forms: React Hook Form, Zod for validation
  - State Management: React Context
  - Queue Management: BullMQ
  - Caching: IORedis
  - Reporting: Recharts, ExcelJS, jsPDF

## Project Structure

The main application code is in the `interalpha-app` directory.

Key directories:
- `src/app/` - Next.js 15 App Router structure with route groups for different user roles
- `src/components/` - Reusable UI components
- `src/contexts/` - React Context providers
- `src/lib/` - Utility functions and service integrations
- `src/services/` - Business logic services
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations
- `public/` - Static assets
- `scripts/` - Utility scripts for setup, testing, and maintenance

## Authentication & Authorization

The application uses Clerk for authentication with a custom role-based access control (RBAC) system.

- **Roles**: `admin`, `gerente-adm`, `gerente-financeiro`, `supervisor-tecnico`, `tecnico`, `atendente`
- **Permissions**: Fine-grained permissions are defined for each role (see `src/lib/auth/permissions.ts`)
- **Middleware**: Authentication and authorization are handled in `middleware.ts`
- **Protected Routes**: Routes under `(dashboard)`, `clientes`, `ordens-servico`, etc. require authentication
- **Public Routes**: Home page, sign-in, sign-up, client login are public

## Development Environment

### Setup
1. Clone the repository
2. Navigate to `interalpha-app`
3. Install dependencies with `npm install`
4. Configure environment variables by copying `.env.example` to `.env.local` and filling in values
5. Set up the database (Neon PostgreSQL) and configure connection strings
6. Initialize integrations (WhatsApp, SMS, Email) as needed
7. Configure Stripe for payments

### Running the Application
- **Development Mode**: `npm run dev` or `npm run dev:turbo` (for Turbopack)
- **Production Build**: `npm run build`
- **Start Production Server**: `npm run start`

### Key Development Scripts
- `npm run setup:dev` - Set up development environment
- `npm run fix-issues` - Run scripts to fix runtime issues
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with test data
- `npm run integrations:init` - Initialize integrations
- `npm run auth:test` - Test Clerk authentication
- `npm run security:check` - Run security checks

### Testing
- **Unit/Integration Tests**: Jest (`npm run test`, `npm run test:watch`)
- **API Tests**: Custom scripts (`npm run test-apis`)
- **Specific Feature Tests**: Various scripts like `npm run ordens:test`, `npm run workflows:test`

## Code Patterns & Conventions

### Frontend Architecture
- **Next.js 15 App Router**: Uses the new file-based routing with route groups for role-specific layouts
- **React Server Components**: Heavy use of async Server Components for data fetching
- **Client Context**: Uses React Context for state management (UserContext, DashboardContext, ThemeContext)
- **UI Components**: Custom UI components built with Radix UI primitives and Tailwind CSS
- **TypeScript**: Strict typing throughout the application

### Backend Architecture
- **API Routes**: Next.js API routes handle backend logic
- **Services**: Business logic is encapsulated in service classes in the `services/` directory
- **Prisma ORM**: Database interactions are handled through Prisma Client
- **Redis**: Used for caching and queue management
- **BullMQ**: Used for background job processing and queue management

### Data Flow
1. **Page Components** (Server) fetch data by calling server-side functions
2. **Server Actions/API Routes** handle business logic, often calling service methods
3. **Services** interact with the database via Prisma and external APIs
4. **Components** (Client) manage UI state using React Context and local state

## Key Features to Understand

### Role-Based Dashboards
There are multiple dashboard implementations for different employee roles (`atendente`, `gerente-adm`, `gerente-financeiro`, `supervisor-tecnico`, `tecnico`). The main dashboard at `/dashboard` is a general one.

### Audit System
There's a comprehensive audit system for tracking system events and security logs, with its own dashboard.

### Integrations
The system has deep integrations with WhatsApp (via official API), SMS (Twilio), Email (Nodemailer), Google Calendar, and Stripe for payments.

### Continuous Improvement
There's a built-in system for tracking user feedback and automatically generating improvement suggestions based on usage patterns and feedback.

## Important Files to Reference
- `src/lib/auth/permissions.ts` - Role and permission definitions
- `middleware.ts` - Authentication and authorization middleware
- `src/contexts/*` - Global state management
- `src/services/*` - Business logic implementations
- `src/app/(dashboard)/dashboard/page.tsx` - Main dashboard implementation
- `package.json` - Dependencies and scripts