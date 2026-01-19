const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkFrist() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT frist, COUNT(*) 
      FROM finn_jobs 
      GROUP BY frist 
      ORDER BY count DESC 
      LIMIT 20
    `);
        console.log("Frist stats:", res.rows);

        // Check for any text columns if frist is not date
        // But assuming frist is date/timestamp.
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

checkFrist();
