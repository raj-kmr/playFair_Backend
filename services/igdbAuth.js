const axios = require("axios")
const qs = require("querystring")

let cachedToken = null;
let tokenExpiry = null;

exports.getIgdbToken = async () =>{
    if(cachedToken && tokenExpiry > Date.now()){
        return cachedToken;
    }

    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials"
    })

    const res =await axios.post(
        "https://id.twitch.tv/oauth2/token",
        params.toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    )

    cachedToken = res.data.access_token;
    tokenExpiry = Date.now() + res.data.expires_in * 1000


    return cachedToken;
}