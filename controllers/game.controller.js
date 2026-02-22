const pool = require("../config/db")

// Retrieve all games for the logged-in user and return summary statistics
exports.getGame = async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows: games } = await pool.query(
            `
            SELECT
                g.id, 
                g.name, 
                g.image, 
                g.initial_playtime_minutes,
                g.playtime_hours
            FROM games g
            JOIN gameList gl ON g.gameList_id = gl.id
            WHERE gl.user_id = $1
            ORDER BY g.created_at DESC
            `,
            [userId]
        )

        const totalPlaytime = games.reduce(
            (sum, game) => sum + game.playtime_hours, 0
        )

        res.status(200).json({
            games,
            totalPlaytime
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch games" })
    }
}

// 
exports.createGame = async (req, res) => {
    const userId = req.user.id;
    const { name, imageUrl, initialPlaytimeMinutes, igdbId, description } = req.body;

    const source = igdbId ? "igdb" : "manual";

    if (!name) {
        return res.status(400).json({ message: "Game name is required" })
    }

    const safeInitialPlaytime = Number.isInteger(initialPlaytimeMinutes) &&
        initialPlaytimeMinutes >= 0 ? initialPlaytimeMinutes : 0;


    try {
        const { rows } = await pool.query(
            "SELECT id FROM gameList WHERE user_id = $1",
            [userId]
        )

        const gameListId = rows[0].id;

        await pool.query(
            `
            INSERT INTO games (
                gameList_id,
                name,
                image, 
                description,
                igdb_id, 
                source,
                initial_playtime_minutes,
                playtime_hours
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $7)
            `,
            [gameListId, name, imageUrl || null, description || null, igdbId || null, source, safeInitialPlaytime]
        );

        res.status(201).json({ message: "Game created successfully" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to create game" })
    }
}

exports.updateGame = async (req, res) => {
    const userId = req.user.id;
    const gameId = Number(req.params.id);
    const { name, imageUrl } = req.body


    if (!name && !imageUrl) {
        return res.status(400).json({
            message: "At least one field is required to update"
        });
    }



    try {
        const result = await pool.query(
            "SELECT g.id FROM games g JOIN gameList gl ON g.gameList_id = gl.id WHERE g.id = $1 AND gl.user_id = $2",
            [gameId, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Game not found" })
        }

        await pool.query(
            `
            UPDATE games
            SET 
                name = COALESCE($1, name),
                image = COALESCE($2, image)
                Where id = $3
        `,
            [name, imageUrl, gameId]
        );

        res.json({ message: "Game updated successfully" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to update game" })
    }
}

exports.deleteGame = async (req, res) => {
    const userId = req.user.id;
    const gameId = req.params.id;

    try {
        const result = await pool.query(
            "SELECT g.id FROM games g JOIN gameList gl ON g.gameList_id = gl.id WHERE g.id = $1 AND gl.user_id = $2",
            [gameId, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Game not found" })
        }

        await pool.query(
            "DELETE FROM games WHERE id = $1",
            [gameId]
        );

        res.json({ message: "Game deleted successfully" });
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to delete game" })
    }
}

exports.addIgdbGame = async (req, res) => {
    const userId = req.user.id;
    const {
        igdbId,
        name,
        imageUrl,
        description,
        playedBefore,
        initialPlaytimeMinutes
    } = req.body;

    if (!igdbId || !name) {
        return res.status(400).json({ message: "IGDB id and name are required" })
    }

    const safePlayTime = playedBefore && Number.isInteger(initialPlaytimeMinutes) && initialPlaytimeMinutes >= 0 ? initialPlaytimeMinutes : 0;

    try {
        const { rows: listRows } = await pool.query(
            "SELECT id FROM gameList WHERE user_id = $1",
            [userId]
        );

        if (!listRows.length) {
            return res.status(404).json({ message: "Game list not found" })
        }

        const gameListId = listRows[0].id;

        const { rows: existing } = await pool.query(
            `
            SELECT id FROM games
            WHERE gameList_id = $1 AND igdb_id = $2
            `,

            [gameListId, igdbId]
        )

        if (existing.length) {
            return res.status(409).json({ message: "Game already added" })
        }

        await pool.query(
            `
            INSERT INTO games (
                gameList_id,
                igdb_id,
                name,
                image,
                description,
                initial_playtime_minutes,
                playtime_hours
            )
                VALUES ($1, $2, $3, $4, $5, $6, $6)
            `,
            [
                gameListId,
                igdbId,
                name.trim(),
                imageUrl || null,
                description || null,
                safePlayTime
            ]
        )

        res.status(201).json({ message: "Game added From IGDB successfully" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to add IGDB games" })
    }
}