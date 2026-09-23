import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// `generate` needs no database and ignores the URL below. `migrate`, `push` and
// `studio` do connect. They read the BFF's .env, and use the direct (unpooled)
// Neon connection — pooled connections break migrations. Override with an
// exported DATABASE_URL_UNPOOLED / DATABASE_URL when running against another db.
config({
  path: fileURLToPath(
    new URL('../../apps/model-catalog/bff/.env', import.meta.url),
  ),
});

const migrationUrl =
  process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'] ?? '';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: migrationUrl,
  },
});
