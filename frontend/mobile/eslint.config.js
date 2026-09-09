const expoConfig = require('eslint-config-expo/flat');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    rules: {
      "no-console": "warn",
    }
  }
];
