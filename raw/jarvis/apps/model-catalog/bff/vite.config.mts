import devServer from '@hono/vite-dev-server';
import nodeAdapter from '@hono/vite-dev-server/node';
import { defineConfig } from 'vite';

const PORT = Number(process.env.PORT ?? 3001);

export default defineConfig(({ command }) => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/apps/model-catalog/bff',

  // Dev runs the Hono app inside Vite on the same port model-catalog-web's proxy expects.
  server: { port: PORT, host: 'localhost' },

  // Workspace shared export their TS source under this condition — same one
  // tsconfig.base.json's customConditions uses, so no prior `nx build` of a lib.
  resolve: {
    conditions: ['@jarvis/source'],
  },

  ssr:
    command === 'build'
      ? // Everything is bundled, so the runtime image carries no node_modules.
        { noExternal: true }
      : {
          // Dev only. Workspace shared resolve to .ts under the condition above, so Vite
          // has to transform them rather than hand them to node.
          noExternal: [
            '@jarvis/model-catalog-contract',
            '@jarvis/db',
            '@jarvis/logging',
          ],
        },

  build: {
    ssr: true,
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node22',
    // @nx/vite/plugin only infers a `build` target when it finds an input here,
    // so the entry stays in rolldownOptions rather than in `build.ssr`.
    rolldownOptions: {
      input: 'src/server.ts',
      output: { entryFileNames: 'main.js' },
    },
  },

  plugins: [devServer({ entry: 'src/main.ts', adapter: nodeAdapter })],
}));
