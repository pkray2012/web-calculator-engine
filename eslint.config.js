import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node }
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-implicit-globals': 'error'
    }
  },
  {
    // Shipped to the browser: no Node globals allowed.
    files: ['src/client/**/*.js', 'src/components/**/*.js', 'src/lib/**/*.js', 'src/adapters/**/*.js', 'src/calculators/**/*.js',
      // page.evaluate() callbacks run in the browser.
      'tests/browser/**/*.mjs'],
    languageOptions: { globals: { ...globals.browser } }
  }
];
