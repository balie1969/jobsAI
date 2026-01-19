
const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugStatusLink() {
    const client = await pool.connect();
    try {
        // 1. Get search ID for 'Lager Test'
        const searchRes = await client.query(`SELECT * FROM user_searches WHERE focus ILIKE '%Lager Test%'`);
        if (searchRes.rows.length === 0) return console.log("Search not found");
        const searchId = searchRes.rows[0].id;

        // 2. Get User ID
        const userRes = await client.query(`SELECT * FROM job_ai_users WHERE id = $1`, [searchRes.rows[0].user_id]);
        const logicalUserId = userRes.rows[0].user_id;

        console.log(`Checking linkage for User: ${logicalUserId} (Internal: ${searchRes.rows[0].user_id}), Search: ${searchId}`);

        // 3. Check finn_job_user_status for this search
        const statusRes = await client.query(`
        SELECT count(*) as total, count(search_id) as with_search_id 
        FROM finn_job_user_status
        WHERE user_id = $1 AND search_id = $2
    `, [logicalUserId, searchId]);
        console.log("finn_job_user_status hit count:", statusRes.rows[0]);

        // 4. Check if we can bridge the gap
        // Join status -> match_result
        const bridgeRes = await client.query(`
        SELECT count(*)
        FROM finn_job_user_status s
        JOIN finn_job_match_result m ON s.finn_id = m.job_id AND s.user_id = m.user_id
        WHERE s.search_id = $1 AND s.user_id = $2
    `, [searchId, logicalUserId]);
        console.log("Matches reachable via status table:", bridgeRes.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

debugStatusLink();
