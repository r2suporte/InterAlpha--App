# Design Document

## Overview

Este design implementa um sistema robusto de configuração de banco de dados que suporta tanto SQLite (desenvolvimento) quanto PostgreSQL via Supabase (produção), com fallback automático e health checks. A arquitetura prioriza simplicidade, confiabilidade e facilidade de manutenção.

## Architecture

### Database Connection Strategy

```mermaid
graph TD
    A[App Startup] --> B[Load Environment Variables]
    B --> C{DATABASE_URL exists?}
    C -->|Yes| D[Test PostgreSQL Connection]
    C -->|No| E[Use SQLite Fallback]
    D -->|Success| F[Use PostgreSQL]
    D -->|Fail| G[Log Error & Use SQLite]
    E --> H[Initialize SQLite]
    F --> I[Run Migrations]
    G --> H
    H --> I
    I --> J[App Ready]
```

### Environment Configuration Hierarchy

1. **Production**: System environment variables
2. **Development**: `.env.local` file
3. **Fallback**: SQLite with default configuration

## Components and Interfaces

### 1. Database Connection Manager (`lib/db.ts`)

```typescript
interface DatabaseConfig {
  url: string;
  provider: 'postgresql' | 'sqlite';
  maxRetries: number;
  retryDelay: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  provider: 'postgresql' | 'sqlite';
  error?: string;
  lastChecked: Date;
}
```

**Responsibilities:**
- Manage Prisma client initialization
- Handle connection fallback logic
- Provide connection status monitoring
- Implement retry mechanism for failed connections

### 2. Health Check Service (`lib/health.ts`)

```typescript
interface HealthCheckResult {
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    provider: string;
    responseTime: number;
    lastError?: string;
  };
  timestamp: Date;
}
```

**Responsibilities:**
- Perform periodic database health checks
- Expose health status via API endpoint
- Log connection issues for monitoring

### 3. Migration Manager (`lib/migrations.ts`)

```typescript
interface MigrationResult {
  success: boolean;
  appliedMigrations: string[];
  errors: string[];
  provider: string;
}
```

**Responsibilities:**
- Execute database migrations automatically
- Handle migration rollbacks if needed
- Support both PostgreSQL and SQLite schemas

### 4. CLI Commands (`scripts/db-setup.js`)

**Available Commands:**
- `npm run db:setup` - Initialize database with fallback
- `npm run db:health` - Check database connection status
- `npm run db:migrate` - Run pending migrations
- `npm run db:reset` - Reset database and run seeds
- `npm run db:switch` - Switch between PostgreSQL and SQLite

## Data Models

### Environment Variables Structure

```bash
# Primary database (PostgreSQL/Supabase)
DATABASE_URL="postgresql://user:pass@host:port/db"
SUPABASE_URL="https://project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Fallback configuration
SQLITE_DATABASE_PATH="./prisma/dev.db"
ENABLE_DB_FALLBACK="true"

# Connection settings
DB_MAX_RETRIES="3"
DB_RETRY_DELAY="1000"
DB_HEALTH_CHECK_INTERVAL="30000"
```

### Prisma Schema Updates

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Will be dynamically switched
  url      = env("DATABASE_URL")
}

// Existing models remain unchanged
// New model for system monitoring
model SystemHealth {
  id          String   @id @default(cuid())
  component   String   // "database", "auth", etc.
  status      String   // "healthy", "degraded", "unhealthy"
  lastChecked DateTime @default(now())
  metadata    Json?    // Additional health data
  
  @@map("system_health")
}
```

## Error Handling

### Connection Error Scenarios

1. **PostgreSQL Unavailable**
   - Log warning with connection details
   - Switch to SQLite automatically
   - Continue application startup

2. **Invalid Credentials**
   - Log authentication error
   - Provide clear error message
   - Use SQLite fallback

3. **Network Issues**
   - Implement exponential backoff retry
   - Cache last successful connection
   - Graceful degradation to SQLite

4. **Migration Failures**
   - Rollback failed migrations
   - Log detailed error information
   - Prevent application startup if critical

### Error Response Format

```typescript
interface DatabaseError {
  code: string;
  message: string;
  provider: string;
  timestamp: Date;
  retryable: boolean;
  fallbackUsed: boolean;
}
```

## Testing Strategy

### Unit Tests

1. **Connection Manager Tests**
   - Test PostgreSQL connection success/failure
   - Test SQLite fallback activation
   - Test retry mechanism behavior

2. **Health Check Tests**
   - Mock database responses
   - Test health status reporting
   - Test error condition handling

3. **Migration Tests**
   - Test migration execution
   - Test rollback scenarios
   - Test cross-provider compatibility

### Integration Tests

1. **Database Switching Tests**
   - Test switching from PostgreSQL to SQLite
   - Test data consistency during switch
   - Test application behavior during transitions

2. **End-to-End Tests**
   - Test complete application flow with both databases
   - Test API endpoints with different database providers
   - Test error scenarios in realistic conditions

### Performance Tests

1. **Connection Performance**
   - Measure connection establishment time
   - Test connection pooling efficiency
   - Monitor memory usage patterns

2. **Query Performance**
   - Compare PostgreSQL vs SQLite performance
   - Test query optimization across providers
   - Monitor slow query detection

## Implementation Phases

### Phase 1: Core Infrastructure
- Database connection manager
- Environment configuration
- Basic fallback mechanism

### Phase 2: Health Monitoring
- Health check service
- API endpoints
- Logging and monitoring

### Phase 3: CLI Tools
- Database management commands
- Migration utilities
- Development tools

### Phase 4: Production Optimization
- Connection pooling
- Performance monitoring
- Advanced error handling

## Security Considerations

1. **Credential Management**
   - Never log database credentials
   - Use environment variables for sensitive data
   - Implement credential rotation support

2. **Connection Security**
   - Enforce SSL for PostgreSQL connections
   - Validate connection certificates
   - Implement connection timeout limits

3. **Access Control**
   - Limit database user permissions
   - Use read-only connections where appropriate
   - Implement query timeout limits

## Monitoring and Observability

1. **Metrics Collection**
   - Connection success/failure rates
   - Query execution times
   - Database provider usage statistics

2. **Logging Strategy**
   - Structured logging for database operations
   - Error tracking and alerting
   - Performance metrics logging

3. **Health Dashboards**
   - Real-time connection status
   - Historical performance data
   - Error rate monitoring