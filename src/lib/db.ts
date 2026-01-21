import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

export interface Job {
  finn_id: number;
  matchscore: number;
  frist: Date | null;
  frist_type: string | null;
  company: string;
  job_title: string;
  job_text_html: string;
  contact1_name: string | null;
  contact1_title: string | null;
  contact1_phone: string | null;
  contact2_name: string | null;
  contact2_title: string | null;
  contact2_phone: string | null;
  yes_1: string | null;
  yes_2: string | null;
  yes_3: string | null;
  yes_4: string | null;
  yes_5: string | null;
  no_1: string | null;
  no_2: string | null;
  no_3: string | null;
  no_4: string | null;
  no_5: string | null;
  recommend_apply: string | null;
  applied_for: Date | null;
  job_url: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  user_id: number;
  fornavn?: string;
  etternavn?: string;
  adresse?: string;
  postnr?: string;
  sted?: string;
  mobil?: string;
  admin_user?: boolean;
}

export interface UserCV {
  id: number;
  user_id: number;
  filename: string;
  file_path: string | null;
  content_type: string | null;
  file_size: number | null;
  cv_text: string | null;
  is_primary: boolean;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const query = `SELECT * FROM "job_ai_users" WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export async function getUserById(userId: string | number): Promise<User | null> {
  const query = `SELECT * FROM "job_ai_users" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

export async function getUserInternal(internalId: number): Promise<User | null> {
  const query = `SELECT * FROM "job_ai_users" WHERE id = $1`;
  const result = await pool.query(query, [internalId]);
  return result.rows[0] || null;
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  // Assuming user_id is auto-increment or we need to generate it. 
  // If job_AI_users.user_id is the link to other tables, we might need to handle it.
  // For now, let's assume the DB handles id generation and user_id might be same as id or separate.
  // Based on user request "Jobs skal kun tilhøre brukeren med user_id", we need to ensure this is set.
  // If user_id is nullable and separate from id, we might need to assume a logic or just insert.
  // Let's insert email and password_hash.
  const query = `
    INSERT INTO "job_ai_users" (email, password_hash, user_id) 
    VALUES ($1, $2, (SELECT COALESCE(MAX(user_id), 0) + 1 FROM "job_ai_users")) 
    RETURNING *
  `;
  const result = await pool.query(query, [email, passwordHash]);
  return result.rows[0];
}

export async function updateUser(userId: string | number, data: Partial<User>) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.fornavn !== undefined) { fields.push(`fornavn = $${idx++}`); values.push(data.fornavn); }
  if (data.etternavn !== undefined) { fields.push(`etternavn = $${idx++}`); values.push(data.etternavn); }
  if (data.adresse !== undefined) { fields.push(`adresse = $${idx++}`); values.push(data.adresse); }
  if (data.postnr !== undefined) { fields.push(`postnr = $${idx++}`); values.push(data.postnr); }
  if (data.sted !== undefined) { fields.push(`sted = $${idx++}`); values.push(data.sted); }
  if (data.mobil !== undefined) { fields.push(`mobil = $${idx++}`); values.push(data.mobil); }

  if (fields.length === 0) return;

  values.push(userId); // Add user_id as the last parameter
  const query = `
    UPDATE "job_ai_users"
    SET ${fields.join(", ")}
    WHERE user_id = $${idx}
  `;

  await pool.query(query, values);
}

export async function getMatchedJobs(userId: string | number, minScore: number = 70, timeframe: string = "all") {
  let timeFilter = "";

  // Handle "Xd" pattern (e.g. 1d, 2d... 7d)
  const dayMatch = timeframe.match(/^(\d+)d$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    timeFilter = `AND fjmr.created_at >= NOW() - INTERVAL '${days} days'`;
  } else if (timeframe === "48h") {
    // Keep backward compatibility if needed, or mapped to 2d
    timeFilter = "AND fjmr.created_at >= NOW() - INTERVAL '48 hours'";
  }

  const query = `
    SELECT 
      fj.finn_id,
      fjmr.matchscore, 
      fj.frist, 
      fj.frist_type, 
      fj.company, 
      fj.job_title, 
      fj.job_text_html, 
      fj.job_url,
      fj.contact1_name, 
      fj.contact1_title, 
      fj.contact1_phone, 
      fj.contact2_name, 
      fj.contact2_title, 
      fj.contact2_phone, 
      fjus.applied_for,
      fjmr.yes_1, fjmr.yes_2, fjmr.yes_3, fjmr.yes_4, fjmr.yes_5,
      fjmr.no_1, fjmr.no_2, fjmr.no_3, fjmr.no_4, fjmr.no_5,
      fjmr.recommend_apply
    FROM finn_jobs fj
    JOIN finn_job_match_result fjmr ON fj.finn_id = fjmr.job_id
    JOIN finn_job_user_status fjus ON fj.finn_id = fjus.finn_id AND fjus.user_id = $2
    WHERE fjmr.user_id = $2
    AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL) 
    AND matchscore >= $1
    ${timeFilter}
    ORDER BY matchscore DESC, frist ASC NULLS FIRST
  `;

  const result = await pool.query(query, [minScore, userId]);
  return result.rows as Job[];
}

export async function markJobAsApplied(userId: string | number, jobId: number) {
  // Try update first
  const updateQuery = `
    UPDATE finn_job_user_status 
    SET applied_for = CURRENT_DATE 
    WHERE finn_id = $1 AND user_id = $2
  `;
  const result = await pool.query(updateQuery, [jobId, userId]);

  // If no row updated, insert new
  if (result.rowCount === 0) {
    const insertQuery = `
      INSERT INTO finn_job_user_status (user_id, finn_id, applied_for)
      VALUES ($1, $2, CURRENT_DATE)
    `;
    await pool.query(insertQuery, [userId, jobId]);
  }
}

export async function markJobAsNotRelevant(userId: string | number, jobId: number) {
  // Try update first
  const updateQuery = `
    UPDATE finn_job_user_status 
    SET applied_for = '1900-01-01'
    WHERE finn_id = $1 AND user_id = $2
  `;
  const result = await pool.query(updateQuery, [jobId, userId]);

  // If no row updated, insert new
  if (result.rowCount === 0) {
    const insertQuery = `
      INSERT INTO finn_job_user_status (user_id, finn_id, applied_for)
      VALUES ($1, $2, '1900-01-01')
    `;
    await pool.query(insertQuery, [userId, jobId]);
  }
}
export async function updatePassword(email: string, passwordHash: string) { const query = `UPDATE "job_ai_users" SET password_hash = $2 WHERE email = $1`; await pool.query(query, [email, passwordHash]); }

export async function getUserCVs(internalId: number): Promise<UserCV[]> {
  const query = `
    SELECT * 
    FROM "user_cvs"
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [internalId]);
  return result.rows;
}

export async function uploadUserCV(internalId: number, data: Partial<UserCV>) {
  const query = `
    INSERT INTO "user_cvs" (user_id, filename, file_path, content_type, file_size, cv_text, is_primary)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await pool.query(query, [
    internalId,
    data.filename,
    data.file_path || null,
    data.content_type,
    data.file_size,
    data.cv_text,
    data.is_primary || false
  ]);
  return result.rows[0];
}



async function deleteMatchesForUser(client: any, internalId: number) {
  // Get logical user_id from internalId
  const userRes = await client.query(`SELECT user_id FROM "job_ai_users" WHERE id = $1`, [internalId]);
  if (userRes.rowCount > 0) {
    const logicalUserId = userRes.rows[0].user_id;
    await client.query(`DELETE FROM "finn_job_match_result" WHERE user_id = $1`, [logicalUserId]);
  }
}

export async function setPrimaryCV(internalId: number, cvId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Set all CVs for this user to is_primary = false
    await client.query(
      `UPDATE "user_cvs" SET is_primary = false WHERE user_id = $1`,
      [internalId]
    );

    // Set the selected CV to is_primary = true
    await client.query(
      `UPDATE "user_cvs" SET is_primary = true WHERE id = $1 AND user_id = $2`,
      [cvId, internalId]
    );

    // Clear old matches as the Resume basis has changed
    await deleteMatchesForUser(client, internalId);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteUserCV(internalId: number, cvId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check count of CVs for this user
    const countRes = await client.query(
      `SELECT COUNT(*) FROM "user_cvs" WHERE user_id = $1`,
      [internalId]
    );
    const count = parseInt(countRes.rows[0].count);

    if (count <= 1) {
      throw new Error("Cannot delete the last CV. At least one CV is required.");
    }

    // Get file path before deleting record
    const cvRes = await client.query(
      `SELECT file_path, is_primary FROM "user_cvs" WHERE id = $1 AND user_id = $2`,
      [cvId, internalId]
    );

    if (cvRes.rowCount === 0) {
      throw new Error("CV not found");
    }

    const { file_path, is_primary } = cvRes.rows[0];

    // If deleting the primary CV, we should probably assign a new primary
    // But since we have > 1 CV (checked above), we can just set the most recent remaining one as primary
    await client.query(
      `DELETE FROM "user_cvs" WHERE id = $1 AND user_id = $2`,
      [cvId, internalId]
    );

    if (is_primary) {
      // Set the most recent remaining CV as primary
      await client.query(`
            UPDATE "user_cvs" 
            SET is_primary = true 
            WHERE id = (
                SELECT id FROM "user_cvs" 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 1
            )
        `, [internalId]);

      // Clear old matches as the primary Resume has changed
      await deleteMatchesForUser(client, internalId);
    }

    await client.query('COMMIT');
    await client.query('COMMIT');
    return { success: true, filePath: file_path, wasPrimary: is_primary }; // Return path so caller can delete file from disk, and wasPrimary to trigger webhook
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export interface UserSearch {
  id: number;
  user_id: number;
  focus: string;
  q_param: string;
  url: string;
  created_at: Date;
  aktiv: boolean;
  avg_relevans_score?: number;
  avg_relevans_matchscore?: number;
  scored_last_24h?: number;
}


export async function getUserSearches(internalId: number): Promise<UserSearch[]> {
  // Use LEFT JOIN to include stats, filtering only high-relevance matches (>=70)
  // We bridge via finn_job_user_status because finn_job_match_result might not have search_id populated
  const query = `
    SELECT 
      us.*,
      ROUND(AVG(fj.score::float))::int AS avg_relevans_score,
      ROUND(AVG(fj.matchscore::float))::int AS avg_relevans_matchscore,
      COUNT(DISTINCT CASE WHEN fj.created_at >= NOW() - INTERVAL '24 hours' THEN fj.job_id END)::int as scored_last_24h
    FROM "user_searches" us
    LEFT JOIN "finn_job_user_status" fus ON us.id = fus.search_id
    LEFT JOIN "finn_job_match_result" fj 
      ON fus.finn_id = fj.job_id 
      AND fus.user_id = fj.user_id
    WHERE us.user_id = $1
    GROUP BY us.id
    ORDER BY us.created_at DESC
  `;
  const result = await pool.query(query, [internalId]);
  return result.rows;
}

export async function addUserSearch(internalId: number, focus: string, qParam: string = "", url: string) {
  const query = `
    INSERT INTO "user_searches" (user_id, focus, q_param, url, aktiv)
    VALUES ($1, $2, $3, $4, true)
    RETURNING *
  `;
  const result = await pool.query(query, [internalId, focus, qParam, url]);
  return result.rows[0];
}

export async function updateSearchStatus(internalId: number, searchId: number, aktiv: boolean) {
  const query = `
    UPDATE "user_searches"
    SET aktiv = $3
    WHERE id = $1 AND user_id = $2
  `;
  await pool.query(query, [searchId, internalId, aktiv]);
  return { success: true };
}

export async function deleteUserSearch(internalId: number, searchId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete associated jobs from dashboard status ONLY if user hasn't interacted with them (applied_for IS NULL)
    // This removes them from the main list, but keeps "Applied" and "Not Relevant"
    // We also keep finn_job_match_result (scoring) as requested
    await client.query(`
      DELETE FROM "finn_job_user_status"
      WHERE search_id = $1 
      AND user_id = (SELECT user_id FROM "job_ai_users" WHERE id = $2)
      AND applied_for IS NULL
    `, [searchId, internalId]);

    // 2. Delete the search itself
    await client.query(`
      DELETE FROM "user_searches"
      WHERE id = $1 AND user_id = $2
    `, [searchId, internalId]);

    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
export async function getJobScoringStats(internalId: number) {
  const client = await pool.connect();
  try {
    // 1. Get logical user_id
    const userRes = await client.query(`SELECT user_id FROM "job_ai_users" WHERE id = $1`, [internalId]);
    if (userRes.rowCount === 0) return { total: 0, completed: 0 };
    const logicalUserId = userRes.rows[0].user_id;

    // 2. Count Total Jobs (Candidates for this user)
    // We count rows in finn_job_user_status for this user, as this tracks all jobs "assigned" to them/found by search
    // IMPORTANT: specific join with finn_jobs to ensure we only count jobs that actually exist and can be scored (mirrors n8n logic)
    const totalRes = await client.query(
      `SELECT COUNT(DISTINCT fjus.finn_id) 
       FROM finn_job_user_status fjus
       JOIN finn_jobs fj ON fjus.finn_id = fj.finn_id
       WHERE fjus.user_id = $1
       AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL)`,
      [logicalUserId]
    );
    const total = parseInt(totalRes.rows[0].count);

    // 3. Count Completed Scores
    const completedRes = await client.query(
      `SELECT COUNT(*) FROM finn_job_match_result WHERE user_id = $1`,
      [logicalUserId]
    );
    const completed = parseInt(completedRes.rows[0].count);

    // 4. Find Missing IDs (for debugging)
    const missingRes = await client.query(
      `SELECT fjus.finn_id 
       FROM finn_job_user_status fjus
       JOIN finn_jobs fj ON fjus.finn_id = fj.finn_id
       WHERE fjus.user_id = $1
       AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL)
       EXCEPT
       SELECT job_id FROM finn_job_match_result WHERE user_id = $1`,
      [logicalUserId]
    );
    const missingIds = missingRes.rows.map(r => r.finn_id);

    return { total, completed, missingIds };
  } finally {
    client.release();
  }
}

export async function getGlobalScoringStats() {
  const client = await pool.connect();
  try {
    // 1. Count Total Candidates (Valid jobs for users with primary CVs)
    // Matches n8n logic: Joined on primary CV, active job, matches user status
    const totalQuery = `
      SELECT COUNT(*) as count
      FROM user_cvs cvs
      JOIN job_ai_users jau ON cvs.user_id = jau.id
      JOIN finn_job_user_status fjus ON fjus.user_id = jau.user_id
      JOIN finn_jobs fj ON fjus.finn_id = fj.finn_id
      WHERE cvs.is_primary = true
      AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL)
    `;
    const totalRes = await client.query(totalQuery);
    const total = parseInt(totalRes.rows[0].count);

    // 2. Count Pending (Unscored Candidates)
    // Same logic + NOT EXISTS in match_result
    const pendingQuery = `
      SELECT COUNT(*) as count
      FROM user_cvs cvs
      JOIN job_ai_users jau ON cvs.user_id = jau.id
      JOIN finn_job_user_status fjus ON fjus.user_id = jau.user_id
      JOIN finn_jobs fj ON fjus.finn_id = fj.finn_id
      WHERE cvs.is_primary = true
      AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM finn_job_match_result fjmr 
        WHERE fjus.user_id = fjmr.user_id AND fjus.finn_id = fjmr.job_id
      )
    `;
    const pendingRes = await client.query(pendingQuery);
    const pending = parseInt(pendingRes.rows[0].count);

    // Completed = Total Valid - Pending
    const completed = total - pending;

    return { total, completed };
  } finally {
    client.release();
  }
}

export async function checkJobExistsForUser(internalId: number, finnId: number) {
  const client = await pool.connect();
  try {
    // 1. Get logical user_id
    const userRes = await client.query(`SELECT user_id FROM "job_ai_users" WHERE id = $1`, [internalId]);
    if (userRes.rowCount === 0) return false;
    const logicalUserId = userRes.rows[0].user_id;

    // 2. Check finn_job_user_status
    // This table tracks if a job is known/assigned to the user (via search or manual add)
    const statusRes = await client.query(
      `SELECT 1 FROM finn_job_user_status WHERE user_id = $1 AND finn_id = $2`,
      [logicalUserId, finnId]
    );

    return (statusRes.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}

export async function getDashboardStats(internalId: number, minScore: number = 70, timeframe: string = "all") {
  const client = await pool.connect();
  try {
    // 1. Get logical user_id
    const userRes = await client.query(`SELECT user_id FROM "job_ai_users" WHERE id = $1`, [internalId]);
    if (userRes.rowCount === 0) {
      return {
        statusCounts: { active: 0, applied: 0, notRelevant: 0 },
        topSearches: [],
        dailyActivity: [],
        deadlineStats: []
      };
    }
    const logicalUserId = userRes.rows[0].user_id;

    // Time filter logic
    let timeFilter = "";
    // Handle "Xd" pattern (e.g. 1d, 2d... 7d)
    const dayMatch = timeframe.match(/^(\d+)d$/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      // Filter based on match result creation time (when we analyzed it)
      timeFilter = `AND fjmr.created_at >= NOW() - INTERVAL '${days} days'`;
    }

    // 2. Status Counts
    // Active: In dashboard (status table) AND unapplied (NULL)
    // Applied: applied_for != '1900-01-01'
    // Not Relevant: applied_for == '1900-01-01' (and applied_for is used to track hidden status)
    // IMPORTANT: Based on previous fix, deleted jobs are gone from status table.
    // So active = rows in status table where applied_for IS NULL.
    // Added timeFilter for stats
    const statusQuery = `
      SELECT
        COUNT(*) FILTER (WHERE applied_for IS NULL AND matchscore >= $2) as active,
        COUNT(*) FILTER (WHERE applied_for IS NOT NULL AND applied_for != '1900-01-01') as applied,
        COUNT(*) FILTER (WHERE applied_for = '1900-01-01') as not_relevant
      FROM finn_job_user_status fjus
      LEFT JOIN finn_job_match_result fjmr ON fjus.finn_id = fjmr.job_id AND fjus.user_id = fjmr.user_id
      WHERE fjus.user_id = $1
      ${timeFilter}
    `;
    const statusRes = await client.query(statusQuery, [logicalUserId, minScore]);
    const statusCounts = {
      active: parseInt(statusRes.rows[0].active || '0'),
      applied: parseInt(statusRes.rows[0].applied || '0'),
      notRelevant: parseInt(statusRes.rows[0].not_relevant || '0')
    };

    // 3. Top Searches (by high relevance matches > 70)
    const topSearchesQuery = `
      SELECT us.focus as name, COUNT(fj.job_id) as count
      FROM user_searches us
      JOIN finn_job_user_status fjus ON us.id = fjus.search_id
      JOIN finn_job_match_result fj ON fjus.finn_id = fj.job_id AND fjus.user_id = fj.user_id
      WHERE us.user_id = $1
      AND fj.matchscore >= $2
      ${timeFilter.replace("fjmr.", "fj.")} -- Alias fix if needed, but here fj matches fjmr structure
      GROUP BY us.focus
      ORDER BY count DESC
      LIMIT 5
    `;
    const topSearchesRes = await client.query(topSearchesQuery, [internalId, minScore]);
    const topSearches = topSearchesRes.rows.map(row => ({ name: row.name, count: parseInt(row.count) }));

    // 4. Daily Activity (New jobs analyzed in last 7 days OR filtered timeframe)
    const activityQuery = `
      SELECT 
        TO_CHAR(created_at, 'Dy') as day,
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM finn_job_match_result fjmr
      WHERE user_id = $1
      AND matchscore >= $2
      ${timeFilter} -- Applies the X days filter logic directly
      -- Default fall-back if no filter (though "all" implies all time, usually restricted to reasonable history for graph)
      ${!timeFilter ? "AND created_at >= NOW() - INTERVAL '29 days'" : ""} 
      GROUP BY day, date
      ORDER BY date ASC
    `;
    const activityRes = await client.query(activityQuery, [logicalUserId, minScore]);
    const dailyActivity = activityRes.rows.map(row => ({ day: row.day, count: parseInt(row.count) }));

    // 5. Deadline Distribution (Active + High Score >= minScore)
    // Group by deadline urgency. Handle NULL as "Snarest".
    // Fix: Filter out expired jobs to match job list logic.
    // Fix: Cast frist to DATE for correct 'I dag' comparison.
    const deadlineQuery = `
      SELECT
        CASE
          WHEN fj.frist IS NULL THEN 'Snarest'
          WHEN fj.frist::DATE = CURRENT_DATE THEN 'I dag'
          WHEN fj.frist::DATE = CURRENT_DATE + INTERVAL '1 day' THEN 'I morgen'
          WHEN fj.frist::DATE > CURRENT_DATE + INTERVAL '1 day' AND fj.frist::DATE <= CURRENT_DATE + INTERVAL '7 days' THEN 'Denne uken'
          WHEN fj.frist::DATE > CURRENT_DATE + INTERVAL '7 days' AND fj.frist::DATE <= CURRENT_DATE + INTERVAL '14 days' THEN 'Neste uke'
          WHEN fj.frist::DATE > CURRENT_DATE + INTERVAL '14 days' THEN 'Senere'
          ELSE 'Utgått' -- Should be filtered out, but safeguard
        END as bucket,
        COUNT(*) as count
      FROM finn_jobs fj
      JOIN finn_job_match_result fjmr ON fj.finn_id = fjmr.job_id
      JOIN finn_job_user_status fjus ON fj.finn_id = fjus.finn_id AND fjus.user_id = $1
      WHERE fjmr.user_id = $1
      AND fjus.applied_for IS NULL -- Only active
      AND fjmr.matchscore >= $2 -- Configurable score
      AND (fj.frist >= CURRENT_DATE OR fj.frist IS NULL) -- Exclude expired
      ${timeFilter}
      GROUP BY bucket
    `;
    const deadlineRes = await client.query(deadlineQuery, [logicalUserId, minScore]);

    // Normalize and sort buckets order. Removed 'Utgått' since we filter them out.
    // 'Snarest' is first.
    const bucketOrder = ['Snarest', 'I dag', 'I morgen', 'Denne uken', 'Neste uke', 'Senere'];
    const deadlineStats = bucketOrder.map(bucket => {
      const row = deadlineRes.rows.find(r => r.bucket === bucket);
      return { bucket, count: row ? parseInt(row.count) : 0 };
    });

    // 6. Scored Last 24h (Global)
    const scoredLast24hQuery = `
      SELECT COUNT(*) as count
      FROM finn_job_match_result
      WHERE user_id = $1
      AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    const scoredLast24hRes = await client.query(scoredLast24hQuery, [logicalUserId]);
    const scoredLast24h = parseInt(scoredLast24hRes.rows[0].count);

    return {
      statusCounts,
      topSearches,
      dailyActivity,
      deadlineStats,
      scoredLast24h
    };

  } finally {
    client.release();
  }
}
