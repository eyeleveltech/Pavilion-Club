import pg from 'pg';
process.loadEnvFile?.('.env');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'pavilion' AND pid <> pg_backend_pid();`);
console.log('Terminated backends:', res.rowCount);
await pool.end();
