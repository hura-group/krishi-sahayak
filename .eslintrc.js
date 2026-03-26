module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier', '@typescript-eslint'],
  ignorePatterns: [
    'node_modules/',
    'supabase/',
    'apps/apps/',
    'apps/mobile/src/',
    '**/*.js',
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'import/no-unresolved': 'off',
    'no-console': 'warn',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};