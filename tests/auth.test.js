const request = require("supertest")
const app = require("../app")
const pool = require("../config/db")


describe("AUTH API", () => {
    const unique = Date.now() + "_" + Math.random();

    const testUser = {
        username: "user_" + unique,
        email: `test_${unique}@mail.com`,
        password: "123456"
    };

    it("should signup a new user", async () => {
        const res = await request(app).post("/auth/signup").send(testUser);

        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty("token")
    })

    it("should signin existing user", async () => {
        const res = await request(app)
            .post("/auth/signin")
            .send({
                email: testUser.email,
                password: testUser.password
            })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("token")
    })

    it("should fail with wrong password", async () => {
        const res = await request(app)
            .post("/auth/signin")
            .send({
                email: testUser.email,
                password: "wrongpassword"
            })

        expect(res.statusCode).toBe(401)
    })

    afterAll(async () => {
        await pool.end()
    })
})