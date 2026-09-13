/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],

  moduleNameMapper: {
    // Root aliases
    '^@/(.*)$':     '<rootDir>/apps/mobile/src/$1',
    '^@web/(.*)$':  '<rootDir>/apps/web/$1',
    // Stub React Native modules that aren't available in Node
    '^react-native$':              '<rootDir>/__tests__/mocks/reactNative.stub.ts',
    '^react-native-maps$':         '<rootDir>/__tests__/mocks/reactNativeMaps.stub.ts',
    '^react-native-mmkv$':         '<rootDir>/__tests__/mocks/mmkv.stub.ts',
    '^expo-location$':             '<rootDir>/__tests__/mocks/expo.stub.ts',
    '^expo-notifications$':        '<rootDir>/__tests__/mocks/expo.stub.ts',
    '^expo-device$':               '<rootDir>/__tests__/mocks/expo.stub.ts',
    '^@react-navigation/(.*)$':    '<rootDir>/__tests__/mocks/expo.stub.ts',
  },

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        strict:                    true,
        target:                    'ES2020',
        module:                    'CommonJS',
        moduleResolution:          'node',
        esModuleInterop:           true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule:         true,
        skipLibCheck:              true,
        jsx:                       'react',
        baseUrl:                   '.',
        paths: {
          '@/*':    ['apps/mobile/src/*'],
          '@web/*': ['apps/web/*'],
        },
      },
      diagnostics: { ignoreCodes: ['TS151001', 2307, 2339, 2345] },
    }],
  },

  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Each test file gets a clean module registry
  resetModules: true,
  clearMocks:   true,

  // Coverage — only count files we actually own
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'apps/mobile/src/utils/alertEvaluator.ts',
    'apps/mobile/src/utils/timeAgo.ts',
    'apps/mobile/src/services/mandiLocatorService.ts',
    'apps/mobile/src/services/priceAlertService.ts',
    'apps/web/lib/supabase-server.ts',
  ],
  coverageThreshold: {
    global: {
      branches:   80,
      functions:  90,
      lines:      90,
      statements: 90,
    },
  },

  // Pretty output
  verbose: true,

  // Timeout — integration tests can be slower
  testTimeout: 15000,
};
