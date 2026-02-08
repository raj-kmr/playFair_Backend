const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User Already Exists!" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const userResult = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [username, email, hashedPassword]
        )

        const userId = userResult.rows[0].id;

        await pool.query(
            "INSERT INTO gameLIst (user_id) VALUES ($1)",
            [userId]
        )

        res.status(201).json({ message: "Signup Successful" })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Server error"})
    }

}

exports.signin = async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT id, password FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        return res.status(400).json({ message: "No account with this email!" })
    }

    const user = result.rows[0];
    console.log(user)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
        { id: user.id }, process.env.JWT_SECRET
    )

    res.json({ message: "Login successful", userId: user.id, "token": token })
}