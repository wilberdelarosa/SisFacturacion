const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Client } = require('pg');

const sqlPath = path.resolve(__dirname, '..', 'docs', 'db.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('SQL file not found:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const client = new Client({ connectionString });

(async () => {
  try {
    await client.connect();
    console.log('Connected to database. Executing SQL file...');

    // Execute as a single batch
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('SQL executed successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error executing SQL:', err.message || err);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // ignore
    }
    await client.end().catch(() => {});
    process.exit(1);
  }
})();
