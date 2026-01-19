
const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    const client = await pool.connect();
    try {
        const tables = ['finn_job_match_result', 'finn_job_user_status', 'user_searches', 'finn_jobs'];
        for (const t of tables) {
            const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [t]);
            console.log(`Table ${t}:`, res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();
