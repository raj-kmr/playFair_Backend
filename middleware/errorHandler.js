const apiError = require("../utils/ApiError");

export function errorHandler(err, req, res, next) {
    const status = err instanceof apiError ? err.statusCode : 500;

    res.status(status).json({
        message: err?.message || "Internal Server Error"
    })
}