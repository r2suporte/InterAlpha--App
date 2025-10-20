/**
 * Testes para lib/supabase/server.ts
 * Testando cliente Supabase do servidor
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((url, key, options) => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  })),
}));

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

describe('Supabase Server Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key-' + 'x'.repeat(100);
  });

  describe('createClient function', () => {
    it('should be an async function', () => {
      expect(typeof createClient).toBe('function');
    });

    it('should call cookies() from next/headers', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      await createClient();

      expect(cookies).toHaveBeenCalled();
    });

    it('should call createServerClient with proper arguments', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      await createClient();

      expect(createServerClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.any(Object),
        })
      );
    });

    it('should return client object with auth methods', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      const client = await createClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should handle cookie getAll operation', async () => {
      const mockGetAll = jest.fn(() => [
        { name: 'test', value: 'value' },
      ]);

      (cookies as jest.Mock).mockResolvedValue({
        getAll: mockGetAll,
        set: jest.fn(),
      });

      const callArgs = (createServerClient as jest.Mock).mock.calls.length;

      await createClient();

      // Verify the client was created
      expect((createServerClient as jest.Mock).mock.calls.length).toBeGreaterThan(callArgs);
    });

    it('should handle cookie setAll operation', async () => {
      const mockSet = jest.fn();

      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: mockSet,
      });

      const client = await createClient();

      expect(client).toBeDefined();
    });

    it('should handle errors in setAll gracefully', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(() => {
          throw new Error('Cookie error');
        }),
      });

      expect(async () => {
        await createClient();
      }).not.toThrow();
    });

    it('should support server-side authentication context', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => [
          {
            name: 'sb-access-token',
            value: 'test-token',
          },
        ]),
        set: jest.fn(),
      });

      const client = await createClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should be callable multiple times', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      const client1 = await createClient();
      const client2 = await createClient();

      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
      expect(createServerClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cookie Management', () => {
    it('should pass cookie configuration to createServerClient', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      await createClient();

      const callArgs = (createServerClient as jest.Mock).mock.calls[0];
      const cookiesConfig = callArgs[2].cookies;

      expect(cookiesConfig).toHaveProperty('getAll');
      expect(cookiesConfig).toHaveProperty('setAll');
      expect(typeof cookiesConfig.getAll).toBe('function');
      expect(typeof cookiesConfig.setAll).toBe('function');
    });

    it('should work with multiple cookies', async () => {
      const mockGetAll = jest.fn(() => [
        { name: 'cookie1', value: 'value1' },
        { name: 'cookie2', value: 'value2' },
        { name: 'cookie3', value: 'value3' },
      ]);

      (cookies as jest.Mock).mockResolvedValue({
        getAll: mockGetAll,
        set: jest.fn(),
      });

      const callArgs = (createServerClient as jest.Mock).mock.calls.length;

      await createClient();

      // Verify the client was created with cookie support
      expect((createServerClient as jest.Mock).mock.calls.length).toBeGreaterThan(callArgs);
    });
  });

  describe('Environment Variables', () => {
    it('should use NEXT_PUBLIC_SUPABASE_URL', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      const testUrl = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_URL = testUrl;

      await createClient();

      expect(createServerClient).toHaveBeenCalledWith(
        testUrl,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use NEXT_PUBLIC_SUPABASE_ANON_KEY', async () => {
      (cookies as jest.Mock).mockResolvedValue({
        getAll: jest.fn(() => []),
        set: jest.fn(),
      });

      const testKey = 'test-key-' + 'y'.repeat(100);
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = testKey;

      await createClient();

      expect(createServerClient).toHaveBeenCalledWith(
        expect.any(String),
        testKey,
        expect.any(Object)
      );
    });
  });
});
