const request = require("supertest")
const app = require("../app")
const pool = require("../config/db")

describe("SESSION FLOW", () => {
    let token
    let gameId

    const unique = Date.now() + "_" + Math.random();

    const user = {
        username: "user_" + unique,
        email: `test_${unique}@mail.com`,
        password: "123456"
    };



    beforeAll(async () => {
        const signup = await request(app)
            .post("/auth/signup")
            .send(user)

        token = signup.body.token

        const gameRes = await request(app)
            .post("/games")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Test Game" });

        gameId = gameRes.body.id;
    })

    it("should start a session", async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/sessions/start`)
            .set("Authorization", `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
    })

    it("should end session", async () => {
        const res = await request(app)
            .post(`/api/sessions/end`)
            .set("Authorization", `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.session).toHaveProperty("duration_seconds")
    })

    afterAll(async () => {
        await pool.end()
    })
})