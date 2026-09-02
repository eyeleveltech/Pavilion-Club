import pg from 'pg';

process.loadEnvFile?.('.env');

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupRoles() {
  console.log('Setting up database roles & permissions...');
  
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pavilion_migrate') THEN
        CREATE ROLE pavilion_migrate LOGIN PASSWORD 'pavilion_migrate_local';
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pavilion_app') THEN
        CREATE ROLE pavilion_app LOGIN PASSWORD 'pavilion_app_local';
      END IF;
    END $$;

    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO pavilion_app;
    REVOKE DELETE ON bookings, payments, refunds, settlements, audit_log FROM pavilion_app;
    REVOKE UPDATE ON audit_log FROM pavilion_app;
  `);

  console.log('✓ Roles pavilion_migrate and pavilion_app configured with REVOKE DELETE.');
  await pool.end();
}

setupRoles().catch((err) => {
  console.error('Failed to setup roles:', err);
  process.exit(1);
});
