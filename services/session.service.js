const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const {
  calculateDurationSeconds,
  formatSessionResponse,
} = require("../utils/session.utils");
const { getAvailableMinutes } = require("./unlock.service");

const sessionsService = {
  async startSession({ userId, gameId }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /**
       * Step 1:
       * Verify the game belongs to the authenticated user.
       *
       * Your schema:
       * users -> gameList (one per user) -> games
       *
       * So we join:
       * games -> gamelist -> users
       */
      const gameCheckQuery = `
        SELECT 
          g.id,
          g.name,
          gl.user_id
        FROM games g
        INNER JOIN gamelist gl ON g.gamelist_id = gl.id
        WHERE g.id = $1 AND gl.user_id = $2
        LIMIT 1
      `;

      const gameCheckResult = await client.query(gameCheckQuery, [gameId, userId]);

      if (gameCheckResult.rowCount === 0) {
        throw new ApiError(404, "Game not found or does not belong to this user");
      }

      /**
       * Step 2:
       * Insert a new active session.
       *
       * Your DB already protects one active session per user:
       * unique index where ended_at IS NULL
       *
       * So even if two requests come quickly, DB stays safe.
       */
      const insertQuery = `
        INSERT INTO game_sessions (users_id, games_id, started_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;

      let insertResult;

      try {
        insertResult = await client.query(insertQuery, [userId, gameId]);
      } catch (error) {
        /**
         * PostgreSQL unique violation error code = 23505
         * This happens if user already has one active session.
         */
        if (error.code === "23505") {
          throw new ApiError(409, "User already has an active session");
        }

        throw error;
      }

      await client.query("COMMIT");

      return formatSessionResponse(insertResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async endActiveSession({ userId }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /**
       * Step 1:
       * Lock the active session row for this user.
       *
       * FOR UPDATE prevents race conditions such as:
       * - user taps stop twice
       * - two requests try to end the same session
       */
      const activeSessionQuery = `
        SELECT *
        FROM game_sessions
        WHERE users_id = $1 AND ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
        FOR UPDATE
      `;

      const activeSessionResult = await client.query(activeSessionQuery, [userId]);

      if (activeSessionResult.rowCount === 0) {
        throw new ApiError(404, "No active session found");
      }

      const activeSession = activeSessionResult.rows[0];
      const endedAt = new Date();
      let durationSeconds = calculateDurationSeconds(
        activeSession.started_at,
        endedAt
      );

      const {availableMinutes} = await getAvailableMinutes(userId, client);
      const availableSeconds = availableMinutes * 60;

      // Cap session duration to available time
      if(durationSeconds > availableSeconds){
        durationSeconds = availableSeconds;
      }

      /**
       * Step 2:
       * Update the active session with end time + duration
       */
      const durationMinutes = Math.floor(durationSeconds / 60);

      const updateQuery = `
        UPDATE game_sessions
        SET ended_at = $1,
            duration_seconds = $2,
            duration_minutes = $3
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        endedAt.toISOString(),
        durationSeconds,
        durationMinutes,
        activeSession.id,
      ]);

      const gameId = activeSession.games_id;

      const totalDurationQuery = `
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
        FROM game_sessions
        WHERE users_id = $1
          AND games_id = $2
          AND ended_at IS NOT NULL
      `;

      const totalDurationResult = await client.query(totalDurationQuery, [
        userId,
        gameId,
      ]);

      const totalSessionSeconds = Number(totalDurationResult.rows[0].total_seconds || 0);

      const gameInfoQuery = `
        SELECT initial_playtime_minutes, playtime_hours
        FROM games
        WHERE id = $1
        LIMIT 1
      `;

      const gameInfoResult = await client.query(gameInfoQuery, [gameId]);

      const initialPlaytimeMinutes = Number(
        gameInfoResult.rows[0]?.initial_playtime_minutes || 0
      )

      const existingPlaytimeHours = Number(
        gameInfoResult.rows[0]?.playtime_hours || 0
      )

      const baseMinutes = initialPlaytimeMinutes > 0 ? initialPlaytimeMinutes : existingPlaytimeHours * 60;

      const totalMinutes = baseMinutes + totalSessionSeconds / 60;
      const totalHours = totalMinutes / 60;

      const updatedGameResult = await client.query(
        `
          UPDATE games
          SET playtime_hours = $1
          WHERE id = $2
          RETURNING id, playtime_hours, initial_playtime_minutes
        `,
        [totalHours, gameId]
      );

      await client.query("COMMIT");

      return formatSessionResponse(updateResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getSessionsByGame({ userId, gameId }) {
    /**
     * First verify the game belongs to the user.
     */
    const gameCheckQuery = `
      SELECT 
        g.id
      FROM games g
      INNER JOIN gamelist gl ON g.gamelist_id = gl.id
      WHERE g.id = $1 AND gl.user_id = $2
      LIMIT 1
    `;

    const gameCheckResult = await pool.query(gameCheckQuery, [gameId, userId]);

    if (gameCheckResult.rowCount === 0) {
      throw new ApiError(404, "Game not found or does not belong to this user");
    }

    /**
     * Fetch session history for this game.
     */
    const sessionsQuery = `
      SELECT *
      FROM game_sessions
      WHERE users_id = $1 AND games_id = $2
      ORDER BY started_at DESC
    `;

    const sessionsResult = await pool.query(sessionsQuery, [userId, gameId]);

    return sessionsResult.rows.map(formatSessionResponse);
  },

  async getActiveSession({ userId }) {
    const query = `
      SELECT *
      FROM game_sessions
      WHERE users_id = $1 AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rowCount === 0) {
      return null;
    }

    return formatSessionResponse(result.rows[0]);
  },
};

module.exports = sessionsService;