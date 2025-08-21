#!/bin/bash

# Production Readiness Check Script for Products Management System
# Validates system configuration, dependencies, and readiness for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REQUIRED_NODE_VERSION="18.0.0"
REQUIRED_POSTGRES_VERSION="13.0"
REQUIRED_REDIS_VERSION="6.0"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

echo -e "${BLUE}🚀 Production Readiness Check for Products Management System${NC}"
echo "=================================================================="

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

version_compare() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# 1. System Dependencies Check
echo -e "\n${BLUE}1. System Dependencies${NC}"
echo "------------------------"

# Node.js version check
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if version_compare "$NODE_VERSION" "$REQUIRED_NODE_VERSION"; then
        check_passed "Node.js version: $NODE_VERSION (>= $REQUIRED_NODE_VERSION required)"
    else
        check_failed "Node.js version: $NODE_VERSION (>= $REQUIRED_NODE_VERSION required)"
    fi
else
    check_failed "Node.js is not installed"
fi

# npm/yarn check
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_passed "npm version: $NPM_VERSION"
else
    check_failed "npm is not installed"
fi

# PostgreSQL check
if command -v psql &> /dev/null; then
    POSTGRES_VERSION=$(psql --version | awk '{print $3}' | sed 's/,//')
    if version_compare "$POSTGRES_VERSION" "$REQUIRED_POSTGRES_VERSION"; then
        check_passed "PostgreSQL version: $POSTGRES_VERSION (>= $REQUIRED_POSTGRES_VERSION required)"
    else
        check_failed "PostgreSQL version: $POSTGRES_VERSION (>= $REQUIRED_POSTGRES_VERSION required)"
    fi
else
    check_failed "PostgreSQL is not installed"
fi

# Redis check
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    if version_compare "$REDIS_VERSION" "$REQUIRED_REDIS_VERSION"; then
        check_passed "Redis version: $REDIS_VERSION (>= $REQUIRED_REDIS_VERSION required)"
    else
        check_failed "Redis version: $REDIS_VERSION (>= $REQUIRED_REDIS_VERSION required)"
    fi
else
    check_warning "Redis is not installed (optional but recommended for caching)"
fi

# 2. Environment Configuration Check
echo -e "\n${BLUE}2. Environment Configuration${NC}"
echo "------------------------------"

# Check for required environment files
if [ -f ".env" ]; then
    check_passed ".env file exists"
else
    check_failed ".env file is missing"
fi

if [ -f ".env.example" ]; then
    check_passed ".env.example file exists"
else
    check_warning ".env.example file is missing"
fi

# Check required environment variables
REQUIRED_ENV_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

if [ -f ".env" ]; then
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            check_passed "Environment variable $var is set"
        else
            check_failed "Environment variable $var is missing"
        fi
    done
fi

# Check optional but recommended environment variables
OPTIONAL_ENV_VARS=(
    "REDIS_URL"
    "BACKUP_DIR"
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASS"
)

if [ -f ".env" ]; then
    for var in "${OPTIONAL_ENV_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            check_passed "Optional environment variable $var is set"
        else
            check_warning "Optional environment variable $var is not set"
        fi
    done
fi

# 3. Database Connectivity and Schema Check
echo -e "\n${BLUE}3. Database Connectivity and Schema${NC}"
echo "------------------------------------"

if [ -f ".env" ]; then
    source .env
    
    # Test database connection
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        check_passed "Database connection successful"
        
        # Check if products table exists
        if psql "$DATABASE_URL" -c "SELECT 1 FROM products LIMIT 1;" &> /dev/null 2>&1; then
            check_passed "Products table exists and is accessible"
        else
            check_failed "Products table does not exist or is not accessible"
        fi
        
        # Check if migrations are up to date
        if command -v npx &> /dev/null; then
            if npx prisma migrate status &> /dev/null; then
                check_passed "Database migrations are up to date"
            else
                check_failed "Database migrations are not up to date"
            fi
        fi
        
    else
        check_failed "Cannot connect to database"
    fi
else
    check_failed "Cannot test database connection - .env file missing"
fi

# 4. Application Dependencies Check
echo -e "\n${BLUE}4. Application Dependencies${NC}"
echo "----------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    check_passed "node_modules directory exists"
else
    check_failed "node_modules directory missing - run 'npm install'"
fi

# Check package.json
if [ -f "package.json" ]; then
    check_passed "package.json exists"
    
    # Check for required dependencies
    REQUIRED_DEPS=(
        "next"
        "react"
        "prisma"
        "@prisma/client"
        "typescript"
    )
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            check_passed "Required dependency $dep is listed"
        else
            check_failed "Required dependency $dep is missing"
        fi
    done
else
    check_failed "package.json is missing"
fi

# Check package-lock.json
if [ -f "package-lock.json" ]; then
    check_passed "package-lock.json exists (dependency lock file)"
else
    check_warning "package-lock.json missing - dependencies may not be locked"
fi

# 5. Build and Compilation Check
echo -e "\n${BLUE}5. Build and Compilation${NC}"
echo "-------------------------"

# Check if TypeScript compiles
if command -v npx &> /dev/null; then
    echo "Checking TypeScript compilation..."
    if npx tsc --noEmit &> /dev/null; then
        check_passed "TypeScript compilation successful"
    else
        check_failed "TypeScript compilation failed"
    fi
    
    # Check if Next.js builds successfully
    echo "Checking Next.js build..."
    if timeout 300 npx next build &> /dev/null; then
        check_passed "Next.js build successful"
    else
        check_failed "Next.js build failed"
    fi
else
    check_warning "Cannot run build checks - npx not available"
fi

# 6. Security Configuration Check
echo -e "\n${BLUE}6. Security Configuration${NC}"
echo "---------------------------"

# Check for security-related configurations
if [ -f ".env" ]; then
    # Check if NEXTAUTH_SECRET is set and not default
    if grep -q "^NEXTAUTH_SECRET=" .env; then
        SECRET_VALUE=$(grep "^NEXTAUTH_SECRET=" .env | cut -d'=' -f2)
        if [ ${#SECRET_VALUE} -ge 32 ]; then
            check_passed "NEXTAUTH_SECRET is set and appears secure (>= 32 characters)"
        else
            check_failed "NEXTAUTH_SECRET is too short (< 32 characters)"
        fi
    fi
    
    # Check if production URL is set correctly
    if grep -q "^NEXTAUTH_URL=" .env; then
        URL_VALUE=$(grep "^NEXTAUTH_URL=" .env | cut -d'=' -f2)
        if [[ $URL_VALUE == https://* ]]; then
            check_passed "NEXTAUTH_URL uses HTTPS"
        else
            check_warning "NEXTAUTH_URL should use HTTPS in production"
        fi
    fi
fi

# Check for sensitive files that shouldn't be in production
SENSITIVE_FILES=(
    ".env.local"
    ".env.development"
    "*.log"
    "dump.rdb"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    if ls $pattern &> /dev/null 2>&1; then
        check_warning "Sensitive file pattern '$pattern' found - should not be in production"
    fi
done

# 7. Performance and Monitoring Setup
echo -e "\n${BLUE}7. Performance and Monitoring${NC}"
echo "-------------------------------"

# Check for monitoring scripts
if [ -f "scripts/load-test-products.js" ]; then
    check_passed "Load testing script is available"
else
    check_warning "Load testing script not found"
fi

if [ -f "src/lib/monitoring/production-monitoring.ts" ]; then
    check_passed "Production monitoring system is available"
else
    check_warning "Production monitoring system not found"
fi

# Check for backup system
if [ -f "scripts/backup-system.js" ]; then
    check_passed "Backup system is available"
else
    check_warning "Backup system not found"
fi

# Check backup directory
if [ -d "$BACKUP_DIR" ]; then
    check_passed "Backup directory exists"
else
    check_warning "Backup directory does not exist"
fi

# 8. Disaster Recovery Preparedness
echo -e "\n${BLUE}8. Disaster Recovery${NC}"
echo "--------------------"

if [ -f "scripts/disaster-recovery.js" ]; then
    check_passed "Disaster recovery system is available"
else
    check_warning "Disaster recovery system not found"
fi

# Check for recovery plan
if [ -f "disaster-recovery-plan.json" ]; then
    check_passed "Disaster recovery plan exists"
else
    check_warning "Disaster recovery plan not found"
fi

# 9. System Resources Check
echo -e "\n${BLUE}9. System Resources${NC}"
echo "-------------------"

# Check available disk space
DISK_USAGE=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    check_passed "Disk usage: ${DISK_USAGE}% (< 80%)"
else
    check_warning "Disk usage: ${DISK_USAGE}% (>= 80% - consider cleanup)"
fi

# Check available memory
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        check_passed "Memory usage: ${MEMORY_USAGE}% (< 80%)"
    else
        check_warning "Memory usage: ${MEMORY_USAGE}% (>= 80%)"
    fi
fi

# Check system load
if command -v uptime &> /dev/null; then
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    check_passed "System load average: $LOAD_AVG"
fi

# 10. Final Validation Tests
echo -e "\n${BLUE}10. Final Validation Tests${NC}"
echo "---------------------------"

# Run basic application tests if available
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "Running application tests..."
    if timeout 120 npm test &> /dev/null; then
        check_passed "Application tests passed"
    else
        check_failed "Application tests failed"
    fi
else
    check_warning "No test script found in package.json"
fi

# Check if critical API endpoints would be accessible
if command -v curl &> /dev/null && [ -f ".env" ]; then
    source .env
    if [[ $NEXTAUTH_URL ]]; then
        echo "Testing application startup..."
        # This would require the app to be running
        # For now, we'll just validate the URL format
        if [[ $NEXTAUTH_URL =~ ^https?:// ]]; then
            check_passed "Application URL format is valid"
        else
            check_failed "Application URL format is invalid"
        fi
    fi
fi

# Summary
echo -e "\n${BLUE}Production Readiness Summary${NC}"
echo "============================"
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

# Determine overall readiness
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 PRODUCTION READY!${NC}"
        echo "All checks passed. The system is ready for production deployment."
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  PRODUCTION READY WITH WARNINGS${NC}"
        echo "All critical checks passed, but there are $WARNINGS warnings to address."
        exit 0
    fi
else
    echo -e "\n${RED}❌ NOT PRODUCTION READY${NC}"
    echo "$CHECKS_FAILED critical checks failed. Please address these issues before deploying to production."
    exit 1
fi