import { defineConfig } from 'tsup';

// Node build (dev / self-hosting). The Cloudflare build is done by wrangler from src/worker.ts.
export default defineConfig({
  entry: ['src/node.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  noExternal: ['@chouf/shared'],
  sourcemap: true,
  clean: true,
});
