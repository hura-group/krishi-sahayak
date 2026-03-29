module.exports = {
  root: true,
  extends: [
    'expo',
    'prettier',
  ],
  plugins: [
    'prettier',
    '@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    // ── Prettier ──────────────────────────────────────────────────────────
    // Treat all prettier violations as ESLint errors (blocks commit via Husky)
    'prettier/prettier': 'error',

    // ── TypeScript ────────────────────────────────────────────────────────
    // No `any` types allowed in production code — use proper types
    '@typescript-eslint/no-explicit-any': 'error',

    // Unused variables are errors — prefix with _ to intentionally ignore
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // ── General ───────────────────────────────────────────────────────────
    // Warn on console.log — Babel strips these in production, but still messy
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Prevent committing debugger statements
    'no-debugger': 'error',

    // No var — use const or let
    'no-var': 'error',

    // Prefer const where value never reassigned
    'prefer-const': 'error',

    // ── React ─────────────────────────────────────────────────────────────
    // We use TypeScript for prop types — no need for PropTypes
    'react/prop-types': 'off',

    // React 17+ JSX transform — no need to import React in every file
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
  ],
};
