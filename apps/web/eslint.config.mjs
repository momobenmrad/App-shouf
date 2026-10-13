import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'next-env.d.ts'] },
  {
    rules: {
      // Artwork is served by our CDN edge with its own caching; next/image optimisation is not needed.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;
