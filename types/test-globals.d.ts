// Types for test environment globals and jest mocks
// Basic test globals to reduce type noise in test files
declare global {
  // Allow tests to override fetch/Response with jest mocks
  var fetch: any;
  var Response: any;
}

// Jest helpers
declare namespace jest {
  interface MockInstance<T = any, Y extends any[] = any[]> {
    (...args: Y): T;
  }
  function fn<T = any, Y extends any[] = any[]>(): jest.MockInstance<T, Y>;
}

// Allow tests to use expect.any and other helpers
declare const expect: import('expect').Expect;

export {};
