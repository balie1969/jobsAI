require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS "user_searches" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES "job_ai_users"(id) ON DELETE CASCADE,
        focus TEXT NOT NULL,
        q_param TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await pool.query(query);
        console.log("Table 'user_searches' created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}

createTable();
