/**
 * Frontend ESLint config: Airbnb + React + React-Hooks + TypeScript, reconciled
 * with Prettier. Style rules: 2-space indent, 90-col lines, named prop/param
 * interfaces over inline typing, TS strict.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    // Must come last to disable formatting rules that conflict with Prettier.
    'prettier',
  ],
  rules: {
    'max-len': ['error', { code: 90, ignoreUrls: true, ignoreStrings: true }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    // Vite uses .tsx for components; allow JSX in .tsx files.
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    // New JSX transform — React import is not required in scope.
    'react/react-in-jsx-scope': 'off',
    // We use function components with const arrow syntax (project convention).
    'react/function-component-definition': [
      'error',
      { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
    ],
    // Default-export the page/component modules Vite expects.
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          'src/test/**',
          'vite.config.ts',
        ],
      },
    ],
    // Components use TypeScript + default parameter values rather than the
    // legacy defaultProps static; the prop-types-era rule does not apply.
    'react/require-default-props': 'off',
    // MUI render-prop slots (Autocomplete renderInput/renderTags) require
    // forwarding their generated params via spread.
    'react/jsx-props-no-spreading': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.cjs', 'vite.config.ts'],
};
