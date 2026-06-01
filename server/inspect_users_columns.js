const { Pool } = require('pg');
(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT,10) : 5432,
    user: process.env.DB_USER || 'gdwb_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'gdwb_app',
  });
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
  await pool.end();
  process.exit(0);
})().catch(e=>{ console.error(e); process.exit(1); });
