
const db = require("../config/db")
const ApiError = require("../middleware/errorHandler")


// Helper: compute duration in seconds
function computeDurationSeconds(started_at, ended_at) {
    const ms = new Date().getTime(ended_at) - new Date().getTime(started_at);
    return Math.max(0, Math.floor(ms / 1000));
}

async function assertGameOwnedByUser(client, { userId, gameId }) {
    const owned = await client.query(
        `
        SELECT 1
        FROM games g
        JOIN gamelist gl ON gl.id = g.gamelist_id
        WHERE g.id = $1 AND gl.users_id = $2
        LIMIT 1
        `, [gameId, userId]
    )

    if (owned.rowCount === 0) {
        throw new ApiError(404, "Game not found or not Accessible");
    }
}

export const sessionsService = {
    /*
        Start Session:
        1. Check if game belongs to user
        2. insert new Session 
    */
    async StartSession({ userId, gameId }) {
        const client = await db.connect();

        try {
            await client.query("BEGIN");

            await assertGameOwnedByUser(client, { userId, gameId });

            let inserted;
            try {
                inserted = await client.query(`
                    INSERT INTO game_sessions (users_id, games_id, started_at)
                    VALUES ($1, $2, now())
                    RETURNING id, users_id, games_id, started_at, ended_at, duration_seconds
                `, [userId, gameId])
            } catch (err) {
                // Postgres unique viloation code = 23505
                // This happens when user already has an active session (ended at IS NULL)
                if (e?.code === "23505") {
                    throw new ApiError(409, "You already have an active session")
                }
                throw e;
            }
            await client.query("COMMIT")
            return inserted.rows[0];
        } catch (err) {
            await client.query("ROLLBACK")
            throw err;
        } finally {
            client.release()
        }
    },

    // End the currently active session for user
    async endActiveSession({userId}) {
        const client = await db.connect();

        try {
            await client.query("BEGIN")

            const active = await client.query(
                `
                SELECT id, users_id, games_id, started_at, ended_at
                FROM game_sessions
                WHERE users_id = $1 AND ended_at IS NULL
                ORDER BY started_at DESC
                LIMIT 1
                FOR UPDATE
                `, [userId]
            )
            
            if(active.rowCount === 0){
                throw new ApiError(404, "No active session to end");
            }

            const s = active.rows[0];
            const endedAt = new Date()
            const durationSeconds = computeDurationSeconds(s.started_at, endedAt)

            const updated = await client.query(
                `
                UPDATE  game_sessions
                SET ended_at = $1
                        duration_seconds = $2
                WHERE id = $3
                RETURNING id, users_id, games_id, started_at, ended_at, duration_seconds
                `, 
                [endedAt.toISOString(), durationSeconds, s.id]
            );

            await client.query("COMMIT")
            return updated.rows[0]
        } catch(err) {
            await client.query("ROLLBACK")
            throw err;
        } finally {
            client.release()
        }
    },

    /* List sessions for a game for this user only.
        Prevents data leakage: user must own the game.
    */ 
   async listSessionsByGame({userId, gameId}){
    const client = await db.connect();

    try {
        await assertGameOwnedByUser(client, {userId, gameId});

        const result = await client.query(
            `
            SELECT id, users_id, games_id, started_at, ended_at, duration_seconds
            FROM game_sessions
            WHERE users_id = $1 AND games_id = $2
            ORDER BY started_at DESC
            LIMIT 200
            `,
            [userId, gameId]
        )
        
        return result.rows;
    } finally{
        client.release();
    }
   },

   // Helper function for frontend hydration
   // Allows app to re-sync on launch even if AsyncStorage was cleared
   async getActiveSession({userId}) {
    const result = await db.query(
        `
        SELECT id, users_id, games_id, started_at, ended_at, duration_seconds
        FROM game_sessions
        WHERE users_id = $1 AND ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
        `, 
        [userId]
    )

    return result.rows[0] || null;
   }

}