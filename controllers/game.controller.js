const pool = require("../config/db")

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

exports.createGame = async (req, res) => {
    const userId = req.user.id;
    const { name, imageUrl, initialPlaytimeMinutes } = req.body;

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
                initial_playtime_minutes,
                playtime_hours
            )
            VALUES($1, $2, $3, $4, $4)
            `,
            [gameListId, name, imageUrl || null, safeInitialPlaytime]
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

