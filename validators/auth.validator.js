const {z, email} = require("zod");

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(1)
})


const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

module.exports = {
    signInSchema,
    signUpSchema
}