import dotenv from 'dotenv';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

let envLoaded = false;
let pool: Pool | null = null;

function loadEnv() {
  if (envLoaded) {
    return;
  }

  dotenv.config({ path: '.env.local' });
  dotenv.config();
  envLoaded = true;
}

function getDatabaseUrl() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return databaseUrl;
}

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return pool;
}

export async function queryDb<T extends QueryResultRow = Record<string, unknown>>(text: string, values: unknown[] = []) {
  return getDbPool().query(text, values) as Promise<QueryResult<T>>;
}
