import jwt from 'jsonwebtoken';
import {
  signJWT,
  verifyJWT,
  createClientToken,
  createUserToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenTimeRemaining,
  type JWTPayload,
} from '../../../lib/auth/jwt';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('lib/auth/jwt - JWT Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signJWT', () => {
    it('should create a valid JWT token', async () => {
      const mockToken = 'mocked.jwt.token';
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, mockToken);
        }
      );

      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin' as const,
      };

      const token = await signJWT(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'user@example.com',
          role: 'admin',
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '7d',
          algorithm: 'HS256',
        }),
        expect.any(Function)
      );
    });

    it('should use custom expiresIn value', async () => {
      const mockToken = 'mocked.jwt.token';
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, mockToken);
        }
      );

      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin' as const,
      };

      await signJWT(payload, '24h');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({ expiresIn: '24h' }),
        expect.any(Function)
      );
    });

    it('should reject on jwt.sign error', async () => {
      const mockError = new Error('JWT sign failed');
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(mockError);
        }
      );

      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin' as const,
      };

      await expect(signJWT(payload)).rejects.toThrow(
        'Erro ao criar token JWT'
      );
    });

    it('should reject when jwt.sign returns no token', async () => {
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, undefined);
        }
      );

      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin' as const,
      };

      await expect(signJWT(payload)).rejects.toThrow(
        'Erro ao criar token JWT'
      );
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid token', async () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (jwt.verify as jest.Mock).mockImplementation((_token, _secret, callback) => {
        callback(null, mockPayload);
      });

      const token = 'valid.jwt.token';
      const payload = await verifyJWT(token);

      expect(payload).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        expect.any(String),
        expect.any(Function)
      );
    });

    it('should reject invalid token', async () => {
      const mockError = new Error('invalid token');
      (jwt.verify as jest.Mock).mockImplementation(
        (_token, _secret, callback) => {
          callback(mockError);
        }
      );

      const token = 'invalid.jwt.token';

      await expect(verifyJWT(token)).rejects.toThrow('Token JWT inválido');
    });

    it('should reject when no payload is returned', async () => {
      (jwt.verify as jest.Mock).mockImplementation(
        (_token, _secret, callback) => {
          callback(null, undefined);
        }
      );

      const token = 'valid.jwt.token';

      await expect(verifyJWT(token)).rejects.toThrow('Token JWT inválido');
    });

    it('should handle expired tokens', async () => {
      const expiredPayload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (_token, _secret, callback) => {
          // jwt.verify typically throws for expired tokens
          callback(new Error('jwt expired'));
        }
      );

      const token = 'expired.jwt.token';

      await expect(verifyJWT(token)).rejects.toThrow('Token JWT inválido');
    });
  });

  describe('createClientToken', () => {
    it('should create a token for cliente with 30d expiration', async () => {
      const mockToken = 'client.jwt.token';
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, mockToken);
        }
      );

      const token = await createClientToken('cliente-456', 'cliente@example.com');

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'cliente-456',
          email: 'cliente@example.com',
          role: 'cliente',
          tipo: 'cliente',
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '30d' }),
        expect.any(Function)
      );
    });

    it('should reject on error', async () => {
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(new Error('Sign error'));
        }
      );

      await expect(
        createClientToken('cliente-456', 'cliente@example.com')
      ).rejects.toThrow('Erro ao criar token JWT');
    });
  });

  describe('createUserToken', () => {
    it('should create a token for user with 7d expiration', async () => {
      const mockToken = 'user.jwt.token';
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, mockToken);
        }
      );

      const token = await createUserToken('user-789', 'user@example.com', 'admin');

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-789',
          email: 'user@example.com',
          role: 'admin',
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '7d' }),
        expect.any(Function)
      );
    });

    it('should create token with different user roles', async () => {
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, 'token');
        }
      );

      const roles: Array<'admin' | 'user' | 'technician'> = ['admin', 'user', 'technician'];

      for (const role of roles) {
        await createUserToken('user-id', 'email@example.com', role);
      }

      expect(jwt.sign).toHaveBeenCalledTimes(3);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const header = 'Bearer valid.jwt.token';
      const token = extractTokenFromHeader(header);

      expect(token).toBe('valid.jwt.token');
    });

    it('should return null for null header', () => {
      const token = extractTokenFromHeader(null);
      expect(token).toBeNull();
    });

    it('should return null for empty header', () => {
      const token = extractTokenFromHeader('');
      expect(token).toBeNull();
    });

    it('should return null for header without Bearer', () => {
      const token = extractTokenFromHeader('Token valid.jwt.token');
      expect(token).toBeNull();
    });

    it('should return null for header with only Bearer', () => {
      const token = extractTokenFromHeader('Bearer');
      expect(token).toBeNull();
    });

    it('should return null for header with too many parts', () => {
      const token = extractTokenFromHeader('Bearer token extra');
      expect(token).toBeNull();
    });

    it('should be case-sensitive for Bearer scheme', () => {
      const token = extractTokenFromHeader('bearer valid.jwt.token');
      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for token not expired', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: futureExp,
      };

      const expired = isTokenExpired(payload);
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: pastExp,
      };

      const expired = isTokenExpired(payload);
      expect(expired).toBe(true);
    });

    it('should return false when no exp is present', () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const expired = isTokenExpired(payload);
      expect(expired).toBe(false);
    });

    it('should return true for token expired just now', () => {
      const nowExp = Math.floor(Date.now() / 1000); // Right now
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: nowExp,
      };

      const expired = isTokenExpired(payload);
      expect(expired).toBe(true);
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('should return correct time remaining', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const futureExp = nowSeconds + 3600; // 1 hour from now
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: futureExp,
      };

      const remaining = getTokenTimeRemaining(payload);

      // Should be approximately 3600 seconds (allowing 1 second margin)
      expect(remaining).toBeGreaterThanOrEqual(3599);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: pastExp,
      };

      const remaining = getTokenTimeRemaining(payload);
      expect(remaining).toBe(0);
    });

    it('should return 0 when no exp is present', () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const remaining = getTokenTimeRemaining(payload);
      expect(remaining).toBe(0);
    });

    it('should handle edge case of token expiring very soon', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const soonExp = nowSeconds + 10; // 10 seconds from now
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: soonExp,
      };

      const remaining = getTokenTimeRemaining(payload);

      expect(remaining).toBeGreaterThanOrEqual(9);
      expect(remaining).toBeLessThanOrEqual(10);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete token lifecycle', async () => {
      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin' as const,
      };

      // Create token
      (jwt.sign as jest.Mock).mockImplementation(
        (_payload, _secret, _options, callback) => {
          callback(null, 'test.token');
        }
      );

      const token = await signJWT(payload);
      expect(token).toBe('test.token');

      // Verify token
      const verifiedPayload: JWTPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (_token, _secret, callback) => {
          callback(null, verifiedPayload);
        }
      );

      const verified = await verifyJWT(token);
      expect(verified).toEqual(verifiedPayload);

      // Check expiration
      const expired = isTokenExpired(verified);
      expect(expired).toBe(false);
    });

    it('should extract and verify token from header', async () => {
      const header = 'Bearer valid.token';
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe('valid.token');

      // Would normally verify here
      const verifiedPayload: JWTPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (_token, _secret, callback) => {
          callback(null, verifiedPayload);
        }
      );

      const verified = await verifyJWT(extracted!);
      const remaining = getTokenTimeRemaining(verified);

      expect(remaining).toBeGreaterThan(0);
    });
  });
});
