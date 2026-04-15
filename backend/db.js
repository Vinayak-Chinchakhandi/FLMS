import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;
export let usingMockData = true;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Railway PostgreSQL requires SSL in production
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });

  pool.query('SELECT 1')
    .then(() => {
      usingMockData = false;
      console.log('✅ PostgreSQL connected successfully');
    })
    .catch((err) => {
      console.warn('⚠️  DB connection failed, falling back to mock data:', err.message);
      pool = null;
      usingMockData = true;
    });
} else {
  console.log('ℹ️  No DATABASE_URL found — running with in-memory mock data');
}

export const query = async (sql, params = []) => {
  if (!pool) throw new Error('No DB connection');
  const result = await pool.query(sql, params);
  return result;
};

export default pool;
