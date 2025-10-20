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

  it('should support insert method', () => {
    const client = createClient();
    const result = client.from('test').insert({});
    expect(result).not.toBeNull();
  });

  it('should support update method', () => {
    const client = createClient();
    const result = client.from('test').update({});
    expect(result).not.toBeNull();
  });

  it('should support delete method', () => {
    const client = createClient();
    const result = client.from('test').delete();
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

    it('should support auth.signInWithPassword', async () => {
      const client = createClient();
      const result = await client.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).not.toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data.user).toBeDefined();
    });

    it('should support auth.signUp', () => {
      const client = createClient();
      expect(typeof client.auth.signUp).toBe('function');
    });

    it('should support single() result method', async () => {
      const client = createClient();
      const result = await client.from('test').select('*').single();
      expect(result).not.toBeNull();
      expect(result.data).toBeDefined();
      expect(result.error).toBeDefined();
    });

    it('should return consistent client structure', () => {
      const client1 = createClient();
      const client2 = createClient();
      
      expect(typeof client1.from).toBe(typeof client2.from);
      expect(typeof client1.auth.getUser).toBe(typeof client2.auth.getUser);
    });
  });
});