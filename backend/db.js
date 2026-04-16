// ─── Database Connection ──────────────────────────────────────────────────────
// Gracefully falls back to mock data if DATABASE_URL is absent or broken.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// pool is null when no DB is configured or connection fails
let _pool = null;

// This is the single source of truth checked by the dataLayer
export let usingMockData = true;

if (process.env.DATABASE_URL) {
  try {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    // Test the connection asynchronously; flip flag only on success
    _pool.query('SELECT 1')
      .then(() => {
        usingMockData = false;
        console.log('✅ PostgreSQL connected — using real database');
      })
      .catch((err) => {
        console.warn('⚠️  DB ping failed, falling back to mock data:', err.message);
        _pool = null;
        usingMockData = true;
      });
  } catch (err) {
    console.warn('⚠️  Pool creation failed, using mock data:', err.message);
    _pool = null;
    usingMockData = true;
  }
} else {
  console.log('ℹ️  No DATABASE_URL — running with in-memory mock data');
}

// Exported query helper — only called when pool is confirmed available
export const query = async (sql, params = []) => {
  if (!_pool) throw new Error('DB pool not available');
  return _pool.query(sql, params);
};

// Export pool for dataLayer (may be null — dataLayer always checks before use)
export { _pool as default };
