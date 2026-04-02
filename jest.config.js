/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      diagnostics: false,
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/*.test.(ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/src/.*\\.e2e\\.',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Prevent worker crashes from Radix UI + fast-check property tests
  workerIdleMemoryLimit: '512MB',
  // Use jsdom for hook and component tests
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Override testEnvironment per file via @jest-environment docblock
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/app/app/**/__tests__/**/*.test.ts',
        '<rootDir>/src/lib/**/__tests__/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
        '^next/cache$': '<rootDir>/src/__mocks__/next-cache.js',
        '^next/headers$': '<rootDir>/src/__mocks__/next-headers.js',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          diagnostics: false,
        }],
      },
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/__mocks__/jest-dom-setup.ts'],
      testMatch: [
        '<rootDir>/src/app/**/__tests__/**/*.test.ts',
        '<rootDir>/src/app/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/components/**/__tests__/**/*.test.ts',
        '<rootDir>/src/components/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/lib/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/hooks/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/providers/**/__tests__/**/*.test.tsx',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
        '^next/cache$': '<rootDir>/src/__mocks__/next-cache.js',
        '^next/headers$': '<rootDir>/src/__mocks__/next-headers.js',
        // Mock ESM-only packages that Jest cannot transform
        '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
        '^lodash-es$': 'lodash',
        // Mock CSS and static assets
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.js',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(@lit-labs|@lit|lit|lodash-es)/)',
      ],
      transform: {
        '^.+\\.(ts|tsx|js|jsx|mjs)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          diagnostics: false,
        }],
      },
    },
  ],
};

module.exports = config;
