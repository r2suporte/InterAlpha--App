import {
  generateClientCredentials,
  hashPassword,
  validateLogin,
  validatePassword,
  verifyPassword,
} from '@/lib/auth/client-auth';

describe('Client Auth Functions', () => {
  describe('generateClientCredentials', () => {
    it('generates credentials with login and senha', () => {
      const credentials = generateClientCredentials(
        'joao@email.com',
        'João Silva'
      );

      expect(credentials).toHaveProperty('login');
      expect(credentials).toHaveProperty('senha');
      expect(credentials.login).toBe('joao_joo');
      expect(credentials.senha).toHaveLength(8);
    });

    it('generates different senhas on multiple calls', () => {
      const credentials1 = generateClientCredentials(
        'test@email.com',
        'Test User'
      );
      const credentials2 = generateClientCredentials(
        'test@email.com',
        'Test User'
      );

      expect(credentials1.senha).not.toBe(credentials2.senha);
    });

    it('handles special characters in email and name', () => {
      const credentials = generateClientCredentials(
        'joão.silva@email.com',
        'João da Silva'
      );

      expect(credentials.login).toMatch(/^[a-z0-9_]+$/);
      expect(credentials.senha).toHaveLength(8);
    });

    it('generates senha with valid characters', () => {
      const credentials = generateClientCredentials(
        'test@email.com',
        'Test User'
      );

      expect(credentials.senha).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('hashPassword', () => {
    it('hashes password successfully', async () => {
      const senha = 'testPassword123';
      const hash = await hashPassword(senha);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(senha);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('generates different hashes for same password', async () => {
      const senha = 'testPassword123';
      const hash1 = await hashPassword(senha);
      const hash2 = await hashPassword(senha);

      expect(hash1).not.toBe(hash2);
    });

    it('hashes empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      const senha = 'testPassword123';
      const hash = await hashPassword(senha);

      const isValid = await verifyPassword(senha, hash);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect password', async () => {
      const senha = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(senha);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('handles invalid hash gracefully', async () => {
      const senha = 'testPassword123';
      const invalidHash = 'invalid-hash';

      const isValid = await verifyPassword(senha, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('validateLogin', () => {
    it('validates correct login format', () => {
      expect(validateLogin('joao_silva')).toBe(true);
      expect(validateLogin('user123')).toBe(true);
      expect(validateLogin('test_user_123')).toBe(true);
    });

    it('rejects invalid login format', () => {
      expect(validateLogin('')).toBe(false);
      expect(validateLogin('ab')).toBe(false); // too short
      expect(validateLogin('user@domain')).toBe(false); // contains @
      expect(validateLogin('user space')).toBe(false); // contains space
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('rejects weak passwords', () => {
      const shortPassword = validatePassword('123');
      expect(shortPassword.valid).toBe(false);
      expect(shortPassword.message).toBeDefined();

      const weakPassword = validatePassword('password');
      expect(weakPassword.valid).toBe(false);
      expect(weakPassword.message).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('can hash and verify generated password', async () => {
      const credentials = generateClientCredentials(
        'test@example.com',
        'Test User'
      );
      const hash = await hashPassword(credentials.senha);
      const isValid = await verifyPassword(credentials.senha, hash);

      expect(isValid).toBe(true);
    });

    it('validates generated login', () => {
      const credentials = generateClientCredentials(
        'test@example.com',
        'Test User'
      );
      expect(validateLogin(credentials.login)).toBe(true);
    });
  });
});
