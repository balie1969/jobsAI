
const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugStats() {
    const client = await pool.connect();
    try {
        console.log("--- Looking for 'Lager Test' ---");
        const searchRes = await client.query(`SELECT * FROM user_searches WHERE focus ILIKE '%Lager Test%'`);
        if (searchRes.rows.length === 0) {
            console.log("No search found with name 'Lager Test'");
            return;
        }
        const search = searchRes.rows[0];
        console.log("Search found:", search);

        console.log("\n--- User Details ---");
        const userRes = await client.query(`SELECT * FROM job_ai_users WHERE id = $1`, [search.user_id]);
        const user = userRes.rows[0];
        console.log("User:", user);

        console.log("\n--- Checking Matches for this Search ---");
        const matchesRes = await client.query(`
        SELECT count(*) as total, count(CASE WHEN matchscore >= 70 THEN 1 END) as matches_over_70
        FROM finn_job_match_result 
        WHERE search_id = $1
    `, [search.id]);
        console.log("Matches count:", matchesRes.rows[0]);

        console.log("\n--- Checking Matches for this User (ignoring search_id) ---");
        const userMatchesRes = await client.query(`
        SELECT count(*) as total
        FROM finn_job_match_result 
        WHERE user_id = $1
    `, [user.user_id]);
        console.log("User matches count:", userMatchesRes.rows[0]);

        console.log("\n--- Testing User's SQL Logic ---");
        const userSql = `
        SELECT 
            us.id AS search_id,
            ROUND(AVG(fj.score::float))::int AS avg_relevans_score,
            ROUND(AVG(fj.matchscore::float))::int AS avg_relevans_matchscore,
            ai.user_id
        FROM job_ai_users ai
        JOIN user_searches us ON ai.id = us.user_id
        JOIN finn_job_match_result fj ON ai.user_id = fj.user_id AND us.id = fj.search_id
        WHERE us.id = $1 AND fj.matchscore >= 70
        GROUP BY us.id, ai.user_id;
    `;
        const checkRes = await client.query(userSql, [search.id]);
        console.log("Query Result:", checkRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

debugStats();
