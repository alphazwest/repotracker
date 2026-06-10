import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the backend. Tests run as native ESM in a Node
 * environment with global test APIs (describe/it/expect/vi). Sources use the
 * NodeNext ".js" import suffix on relative paths; the resolver plugin below
 * rewrites a relative "./x.js" specifier to the on-disk "./x.ts" so those
 * imports resolve without altering source paths.
 */
export default defineConfig({
  plugins: [
    {
      name: 'resolve-nodenext-js-suffix',
      enforce: 'pre',
      async resolveId(source, importer, options) {
        if (importer && /^\.{1,2}\//.test(source) && source.endsWith('.js')) {
          const asTs = `${source.slice(0, -'.js'.length)}.ts`;
          const resolved = await this.resolve(asTs, importer, {
            ...options,
            skipSelf: true,
          });
          if (resolved) {
            return resolved;
          }
        }
        return null;
      },
    },
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
});
