import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  // Bundle the workspace package (TypeScript sources); keep npm deps external.
  noExternal: ['@chouf/shared'],
  sourcemap: true,
  clean: true,
});
