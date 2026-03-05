// Load test environment variables
const { loadEnvConfig } = require('@next/env');

// Load .env.test file for testing
loadEnvConfig(process.cwd(), true, {
  info: () => null,
  error: console.error,
});

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-only';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://test:test@localhost:5432/interalpha_test';
process.env.REDIS_DISABLED = 'true';

// Mock external services in test environment
if (process.env.NODE_ENV === 'test') {
  // Mock email service
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';

  // Mock payment service
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';

  // Mock SMS/WhatsApp
  process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
  process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
}
