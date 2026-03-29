function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if(err.name === "ZodError"){
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors
    })
  }

  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
}

module.exports = errorHandler;