/**
 * Backend ESLint config: Airbnb base + TypeScript, reconciled with Prettier.
 * Style rules: 2-space indent, 90-col lines, named prop/param interfaces over
 * inline typing, TS strict.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    // eslint-config-prettier must come last: it turns off rules that conflict
    // with Prettier (indent, quotes, comma-dangle, etc.).
    'prettier',
  ],
  rules: {
    // Enforced style rules. Prettier owns formatting, but max-len
    // is asserted here so violations surface via `lint`, not just `format`.
    'max-len': ['error', { code: 90, ignoreUrls: true, ignoreStrings: true }],
    // Prefer named interfaces over inline object types for params/props.
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    // Boot shell logs to stdout; console is intentional here.
    'no-console': 'off',
    // Allow dev-only deps (configs, tests) to import from devDependencies.
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/vitest.config.ts',
        ],
      },
    ],
    // Single boot entrypoint; named exports not required for it.
    'import/prefer-default-export': 'off',
  },
  // Config files (*.cjs) are tooling, not application source, and live outside
  // tsconfig's `include`. They are excluded from the typed lint pass; `lint`
  // targets src/ TypeScript only.
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.cjs'],
};
