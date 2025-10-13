const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // Base configuration
  js.configs.recommended,

  // Use Next.js config (which includes TypeScript and React rules)
  ...compat.extends('next/core-web-vitals'),

  // Custom rules for enhanced security and code quality
  {
    rules: {
      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-alert': 'warn',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // Code quality
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'always'],
      'no-magic-numbers': [
        'warn',
        { ignore: [-1, 0, 1, 2, 100, 200, 400, 401, 403, 404, 500] },
      ],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Best practices
      'array-callback-return': 'error',
      'consistent-return': 'warn',
      'dot-notation': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-nested-ternary': 'error',
      'no-param-reassign': 'error',
      'no-return-assign': 'error',
      'no-throw-literal': 'error',
      'no-unneeded-ternary': 'error',
      'no-unused-expressions': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      radix: 'error',
      yoda: 'error',
    },
  },

  // Configuration files - more relaxed rules
  {
    files: [
      '*.config.js',
      '*.config.ts',
      'next.config.js',
      'tailwind.config.js',
      'jest.config.js',
      'cypress.config.ts',
      'eslint.config.js',
      'postcss.config.js',
    ],
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'prefer-template': 'off',
    },
  },

  // Test files - more relaxed rules
  {
    files: [
      '**/__tests__/**/*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/cypress/**/*',
      '**/jest.setup.*',
      '**/testsprite_tests/**/*',
    ],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        // Cypress globals
        cy: 'readonly',
        Cypress: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'prefer-arrow-callback': 'off',
      'no-undef': 'off', // Desativa no-undef em testes pois os globals são definidos no runtime
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      '.env*',
      'public/**',
      '*.min.js',
      'coverage/**',
      '.nyc_output/**',
      'cypress/downloads/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
      'migrations/**/*.sql',
      'supabase/migrations/**',
      '.swc/**',
    ],
  },
];
