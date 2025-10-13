const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Configuração específica para testes de API (ambiente node)
const customJestConfig = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/testsprite_tests/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/api/**/*.(test|spec).(js|jsx|ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Remove transform to let Next.js handle it with SWC
  transformIgnorePatterns: ['/node_modules/(?!(.*\\.mjs$))'],
  // Não usar o setup padrão que tem dependências do DOM
  setupFiles: ['<rootDir>/jest.env.js'],
};

module.exports = createJestConfig(customJestConfig);
