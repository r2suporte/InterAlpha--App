/// <reference types="jest" />

// Declarações globais para Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toThrow(expected?: any): R;
      toMatchObject(expected: any): R;
      toHaveProperty(property: string, value?: any): R;
      toHaveLength(expected: number): R;
      toMatch(expected: string | RegExp): R;
      toBeCloseTo(expected: number, precision?: number): R;
      toBeInstanceOf(expected: any): R;
      toStrictEqual(expected: any): R;
    }
  }
}

export {};