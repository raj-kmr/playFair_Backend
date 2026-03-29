const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const {signUpSchema, signInSchema} = require("../validators/auth.validator")

// // Prevent duplicate accounts by enforcing unique email
// // hash the password and store user details in database
exports.signup = async (req, res) => {
    const client = await pool.connect();
    try {
        const parsed = signUpSchema.parse(req.body);
        const { email, password, username } = parsed;

        await client.query("BEGIN");
        const userExists = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (userExists.rows.length > 0) {
            await client.query("ROLLBACK")
            return res.status(400).json({ message: "User Already Exists!" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const userResult = await client.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [username, email, hashedPassword]
        )

        const userId = userResult.rows[0].id;

        await client.query(
            "INSERT INTO gameList (user_id) VALUES ($1)",
            [userId]
        )

        await client.query(`
                INSERT INTO unlock_rules (user_id, minutes_per_task, daily_limit_minutes)
                VALUES($1, $2, $3)
            `, [userId])

        await client.query("COMMIT")

        res.status(201).json({ message: "Signup Successful" })
    } catch (err) {
        await client.query("ROLLBACK")
        console.error(err)
        res.status(500).json({ message: "Server error" })
    } finally {
        client.release();
    }

}

exports.signin = async (req, res) => {
    try {
        const parsed = signInSchema.parse(req.body)
        const { email, password } = parsed;

        const result = await pool.query(
            "SELECT id, password FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "No account with this email!" })
        }

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: "Invalid credentails" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" }
        )

        res.json({ message: "Login successful", userId: user.id, "token": token })
    } catch (err) {
        res.status(500).json({message: "Server error"})
    }

}