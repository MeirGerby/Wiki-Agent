import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/apps/model-catalog/web',
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/trpc': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    port: 5173,
    host: 'localhost',
  },
  // @jarvis/ui exports its TS source under this condition — same one tsconfig.base.json's
  // customConditions uses for tsc, so dev/build both resolve straight to source, no prior
  // `nx build` of the lib needed.
  resolve: {
    conditions: ['@jarvis/source'],
  },
  plugins: [
    // Must come before @vitejs/plugin-react.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],

  // One `nx build` writes both halves of the container layout every deployable app
  // shares: dist/main.js is the server, dist/public is what it serves.
  environments: {
    client: {
      build: {
        outDir: './dist/public',
        emptyOutDir: true,
        reportCompressedSize: true,
        commonjsOptions: {
          transformMixedEsModules: true,
        },
      },
    },
    ssr: {
      // Everything is bundled, so the runtime image needs no node_modules.
      resolve: {
        noExternal: true,
      },
      build: {
        ssr: true,
        outDir: './dist',
        // dist/public is written by the client build, so this must not clear dist.
        emptyOutDir: false,
        target: 'node22',
        rolldownOptions: {
          input: 'src/server.ts',
          output: { entryFileNames: 'main.js' },
        },
      },
    },
  },

  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments['client']);
      await builder.build(builder.environments['ssr']);
    },
  },
}));
