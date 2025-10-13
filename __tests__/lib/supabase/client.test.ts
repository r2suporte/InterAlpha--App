import { createClient } from '@/lib/supabase/client';

describe('Supabase Client', () => {
  it('should create a client instance', () => {
    const client = createClient();
    expect(client).not.toBeNull();
  });

  it('should have auth property', () => {
    const client = createClient();
    expect(client.auth).not.toBeNull();
  });

  it('should have from method', () => {
    const client = createClient();
    expect(typeof client.from).toBe('function');
  });

  it('should return query builder from from method', () => {
    const client = createClient();
    const queryBuilder = client.from('test');
    expect(queryBuilder).not.toBeNull();
  });

  it('should have select method in query builder', () => {
    const client = createClient();
    const queryBuilder = client.from('test');
    expect(typeof queryBuilder.select).toBe('function');
  });

  it('should have eq method in query builder', () => {
    const client = createClient();
    const queryBuilder = client.from('test').select('*');
    expect(typeof queryBuilder.eq).toBe('function');
  });

  it('should chain methods in query builder', () => {
    const client = createClient();
    const result = client.from('test').select('*').eq('id', 1);
    expect(result).not.toBeNull();
  });

  describe('Development Mode', () => {
    it('should use mock client in development', () => {
      const client = createClient();
      expect(client).not.toBeNull();
    });

    it('should have mock auth methods', async () => {
      const client = createClient();
      expect(typeof client.auth.getUser).toBe('function');
      expect(typeof client.auth.signOut).toBe('function');
      
      // Test that methods actually work
      const userResult = await client.auth.getUser();
      expect(userResult.data).not.toBeNull();
      
      const signOutResult = await client.auth.signOut();
      expect(signOutResult.error).toBeNull();
    });
  });
});