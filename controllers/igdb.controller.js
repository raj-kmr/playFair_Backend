const axios = require("axios");
const { getIgdbToken } = require("../services/igdbAuth");


exports.searchGames = async(req, res) => {
    const { q } = req.query;

    if(!q){
        return res.status(400).json({message: "Search query required"})
    }

    try {
        const token = await getIgdbToken();

        const response = await axios.post(
            "https://api.igdb.com/v4/games",
            `
            search "${q}";
            fields id, name, summary, cover.url;
            limit 10;
            `,
            {
                headers: {
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
                    Authorization: `Bearer ${token}`
                }
            }
        )

        const games = response.data.map(game => ({
            igdbId: game.id,
            name: game.name,
            description: game.summary || "",
            imageUrl: game.cover ? game.cover.url.replace("t_thumb", "t_cover_big")
            : null
        }))

        res.json(games)
    } catch (err) {
        console.log(err)
        res.status(500).json({message: "IGDB search failed"})
    }
}