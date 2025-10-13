# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 🛠️ Development Commands

### Core Development
```bash
npm install                  # Install dependencies
npm run dev                  # Start development server (default mode)
npm run dev:turbo            # Start with Turbopack (faster hot reload)
npm run build                # Build for production
npm run start                # Start production server
```

### Testing
```bash
npm run test                 # Run Jest unit tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage report
npm run test:ci              # Run tests for CI (no watch)
npm run test:debug           # Debug tests with open handles detection
npm run test:integration     # Run integration tests only

# End-to-End Testing
npm run cypress:open         # Open Cypress UI for E2E tests
npm run cypress:run          # Run Cypress headless
npm run test:e2e             # Run E2E tests (waits for server)
npm run test:e2e:dev         # Start dev server and run E2E tests
```

### Code Quality
```bash
npm run lint                 # Check for linting errors (next lint)
npm run lint:check           # ESLint check
npm run lint:fix             # Auto-fix linting issues
npm run format:check         # Check code formatting (Prettier)
npm run format:write         # Auto-format code
npm run type:check           # TypeScript type checking
npm run type:test            # Type check test files
npm run code:check           # Run lint + format + type checks
npm run code:fix             # Auto-fix lint and format issues
```

### Database Operations
```bash
npm run db:push              # Push schema changes to database (Prisma)
npm run db:studio            # Open Prisma Studio UI
npm run db:generate          # Generate Prisma Client

# Supabase Direct Scripts
node check-schema-sync.js           # Verify Supabase schema sync
node check-table-structure.js       # Verify table structures
node check-rls-policies.js          # Check Row Level Security policies
node check-constraints.js           # Verify database constraints
node apply-schema.js                # Apply schema changes directly
node apply-migration-direct.js      # Run migrations directly
```

### Development Tools
```bash
npm run dev:health           # Check project health status
npm run dev:setup            # Initialize development environment
npm run dev:clean            # Clean cache and build artifacts
npm run dev:info             # Display project information

npm run deps:update          # Update dependencies
npm run deps:check           # Check for outdated dependencies
npm run security:check       # Run security audit
npm run full:check           # Complete project verification (health + code + tests + security)
```

### Service Testing
```bash
npm run email:test           # Test email configuration
npm run sms:test             # Test SMS/Twilio integration
npm run whatsapp:test        # Test WhatsApp integration
npm run workflows:test       # Test workflow automation

npm run integrations:init    # Initialize integration services
npm run integrations:health  # Check integration services health
npm run integrations:stats   # View integration queue statistics
```

### Backup & Maintenance
```bash
npm run backup:run           # Create database backup
npm run backup:install       # Install backup cron job
npm run backup:uninstall     # Remove backup cron job
npm run backup:status        # Check backup status
npm run backup:test          # Test backup configuration
```

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router with TypeScript)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma (with Supabase integration)
- **Authentication**: Supabase Auth with JWT
- **UI**: Tailwind CSS + Radix UI + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Cypress
- **Real-time**: Socket.io for live updates

### Project Structure
```
app/                      # Next.js App Router
├── api/                 # API routes with authentication middleware
│   ├── auth/           # Authentication endpoints
│   ├── clientes/       # Client management
│   ├── equipamentos/   # Equipment management
│   ├── ordens-servico/ # Service orders (core business logic)
│   ├── metrics/        # Performance and business metrics
│   └── relatorios/     # Reporting endpoints
├── auth/               # Authentication pages (login)
├── dashboard/          # Admin dashboard pages
│   ├── clientes/       # Client management UI
│   ├── ordens-servico/ # Service order management UI
│   ├── financeiro/     # Financial management
│   └── relatorios/     # Reports and analytics
└── portal/             # Customer portal (client-facing)

components/
├── ui/                 # Base shadcn/ui components
├── admin/              # Admin-specific components
└── dashboard/          # Dashboard-specific components

lib/
├── auth/               # Authentication logic and JWT handling
│   ├── client-auth.ts      # Client-side auth utilities
│   ├── role-middleware.ts  # Role-based access control (RBAC)
│   └── jwt.ts              # JWT verification
├── middleware/         # API middleware (logging, metrics, cache)
│   ├── api-logger.ts       # Automatic API logging
│   ├── metrics-middleware.ts  # Performance tracking
│   └── cache-middleware.ts    # Response caching with TTL
├── services/           # Business logic services
│   ├── email-service.ts       # Nodemailer integration
│   ├── sms-service.ts         # Twilio SMS
│   ├── whatsapp-service.ts    # WhatsApp Business API
│   ├── communication-service.ts  # Unified messaging
│   └── alert-service.ts       # System alerts
├── database/           # Database utilities
│   └── query-optimizer.ts     # Query optimization helpers
└── supabase/          # Supabase client configuration
    ├── client.ts      # Client-side Supabase instance
    └── server.ts      # Server-side Supabase instance

hooks/                  # Custom React hooks
├── use-permissions.tsx # Permission checking hook
├── use-cache.ts       # Client-side caching
└── use-websocket.ts   # Real-time WebSocket connection
```

### Database Architecture

The system uses **PostgreSQL via Supabase** with Row Level Security (RLS) policies.

**Core Tables:**
- `users` - User accounts with role-based permissions
- `clientes` - Customer/client information
- `ordens_servico` - Service orders (main business entity)
- `pagamentos` - Payment records linked to service orders

**Key Features:**
- UUID primary keys (gen_random_uuid())
- Row Level Security (RLS) enforced for multi-tenancy
- Timestamps with timezone (timestamptz)
- Cascading deletes for data integrity
- Created_by tracking for audit trails

**Database Tools:**
- Use Prisma for schema management and type generation
- Direct Supabase scripts available for advanced operations
- RLS policies enforce data access at the database level

### Authentication & Authorization

**Role Hierarchy (in order of privilege):**
1. `diretor` - Director (strategic access)
2. `admin` - Administrator (full system access)
3. `gerente_adm` - Administrative Manager (operations & HR)
4. `gerente_financeiro` - Financial Manager (finance & reports)
5. `supervisor_tecnico` - Technical Supervisor (technician oversight)
6. `technician` - Technician (service execution)
7. `atendente` - Attendant (reception & basic operations)
8. `user` - Basic user

**Permission System:**
- Route-based permissions defined in `lib/auth/role-middleware.ts`
- API routes protected by `withAuth` and `withPermissions` middleware
- Permissions follow pattern: `resource.action` (e.g., `clientes.create`)
- RLS policies at database level provide additional security

**Authentication Flow:**
1. Login via `/api/auth/login` returns JWT token
2. Token stored in cookies/localStorage
3. Middleware validates JWT on protected routes
4. Role checked against required permissions
5. RLS policies filter database queries by user role

### API Architecture

**Middleware Stack:**
All API routes use a composable middleware pattern:

```typescript
// Example from codebase
withAuth(           // 1. Verify authentication
  withPermissions(  // 2. Check permissions
    withLogging(    // 3. Log request/response
      withMetrics(  // 4. Track performance
        handler    // 5. Execute business logic
      )
    )
  )
)
```

**Key Middleware:**
- `withAuth` - JWT validation
- `withPermissions` - Role-based access control
- `withLogging` - Automatic request/response logging
- `withMetrics` - Performance tracking and monitoring
- `withCache` - Response caching with configurable TTL

**API Patterns:**
- All requests validated with Zod schemas
- Consistent error responses: `{ error: string, details?: any }`
- Success responses: `{ success: true, data: any }`
- Security events logged to `security_audit_logs` table

## 🔧 Development Workflow

### Environment Setup

1. **Required Environment Variables** (`.env.local`):
```bash
# Database
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."  # For admin operations

# Auth
NEXTAUTH_SECRET="..."
```

2. **Optional Integrations** (feature-dependent):
```bash
# Email (Nodemailer)
SMTP_HOST, SMTP_USER, SMTP_PASS

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

# Payments (Stripe)
STRIPE_SECRET_KEY

# Redis (if using cache/queues)
REDIS_HOST, REDIS_PORT
```

### Making Changes

**Component Development:**
- Use TypeScript for all new code
- Follow existing patterns in `components/ui/` for base components
- Business components in `components/dashboard/` or `components/admin/`
- Use React Hook Form + Zod for form validation

**API Development:**
- API routes in `app/api/[resource]/route.ts`
- Always use middleware stack (auth, permissions, logging)
- Validate input with Zod schemas
- Follow RESTful conventions

**Database Changes:**
1. Update `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma Client
3. Run `npm run db:push` to apply to Supabase
4. For complex migrations, use `node apply-migration-direct.js`

### Testing Guidelines

**Unit Tests:**
- Place tests in `__tests__/` matching source structure
- Test files: `*.test.ts` or `*.test.tsx`
- Mock external services (Supabase, APIs)
- Target 70%+ coverage for critical paths

**Integration Tests:**
- Place in `__tests__/integration/`
- Test API endpoints with real database calls
- Use test database or transactions for isolation

**E2E Tests:**
- Place in `cypress/e2e/`
- Test critical user workflows
- Login, create service order, client portal access

**Run Tests Before Committing:**
```bash
npm run code:check      # Lint, format, types
npm run test:ci         # Run all unit tests
npm run build           # Ensure production build works
```

## 🎯 Domain-Specific Guidance

### Service Order Management
Service orders (`ordens_servico`) are the core entity:
- Workflow: `aberta` → `em_andamento` → `aguardando_peca` → `concluida`
- Status changes trigger automated communications (email/SMS/WhatsApp)
- Customer portal allows clients to track orders in real-time
- Each status change is logged for audit purposes

### Communication System
The app has a unified communication service (`lib/services/communication-service.ts`):
- Supports Email (Nodemailer), SMS (Twilio), WhatsApp (Twilio/Business API)
- Templates stored in service with variable substitution
- Communication history tracked in database
- Async processing via job queues (when Redis available)

### Permissions Model
When checking permissions, use the hook:
```typescript
import { usePermissions } from '@/hooks/use-permissions'

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

// Check single permission
if (hasPermission('clientes.create')) { ... }

// Check any of multiple
if (hasAnyPermission(['clientes.read', 'clientes.update'])) { ... }
```

### Metrics & Reporting
Dashboard metrics come from multiple sources:
- Real-time metrics via `app/api/metrics/route.ts`
- Cached with TTL to prevent database overload
- Reports generated via `app/api/relatorios/` endpoints
- Export formats: JSON, CSV, Excel (ExcelJS)

## 📝 Important Conventions

### Code Style
- TypeScript strict mode enabled
- Use Prettier with Tailwind plugin for formatting
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, etc.
- Component files: PascalCase (e.g., `ClientForm.tsx`)
- Utility files: kebab-case (e.g., `api-logger.ts`)

### Database Conventions
- UUID primary keys (never expose auto-increment IDs)
- All timestamps use `timestamptz`
- Soft deletes via `is_active` flag (except where cascade delete appropriate)
- Created/updated timestamps automatically managed
- Use Prisma's `@@map()` for table/column name mapping to match Supabase

### Security Practices
- Never log sensitive data (passwords, tokens, PII)
- Always validate and sanitize user input
- Use parameterized queries (Prisma handles this)
- RLS policies must be verified after schema changes
- Run `npm run security:check` before deploying

## 🚨 Common Pitfalls

1. **Supabase Service Role Key**: Required for admin operations that bypass RLS. Use carefully.

2. **Cache Invalidation**: When updating data, consider cache TTLs in `withCache` middleware. May need manual invalidation.

3. **Status Transitions**: Service order status changes have business logic. Don't update status directly without using proper endpoint.

4. **Permission Checks**: Always use middleware for API routes. Don't rely only on client-side checks.

5. **Database Migrations**: For complex changes, test in development first. RLS policies can fail silently if misconfigured.

## 🔗 Related Documentation

- Full documentation in `.context/docs/README.md`
- Contribution guidelines: `CONTRIBUTING.md`
- Migration guide for roles: `docs/MIGRATION_GUIDE.md`
- Security practices: `docs/SECURITY.md`
- Architecture details: `docs/architecture-audit-report.md`
