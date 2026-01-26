import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schemas',
  out: './src/db/migrations',
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
