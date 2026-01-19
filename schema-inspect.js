
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function inspectSchema() {
    try {
        console.log("Checking job_ai_users columns...");
        const usersCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_ai_users'
    `);
        console.table(usersCols.rows);

        console.log("Checking user_cvs columns...");
        const cvsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_cvs'
    `);
        console.table(cvsCols.rows);

        console.log("Checking constraints on user_cvs...");
        const constraints = await pool.query(`
      SELECT
          tc.constraint_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'user_cvs' AND tc.constraint_type = 'FOREIGN KEY';
    `);
        console.table(constraints.rows);

        console.log("Checking user with user_id=12345...");
        const user = await pool.query('SELECT id, user_id, email FROM job_ai_users WHERE user_id = 12345');
        console.log("User found:", user.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

inspectSchema();
