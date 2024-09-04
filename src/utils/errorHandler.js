import { ApiError } from "./ApiError.js";

function errorHandler(err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle other errors (like 404 or 500)
    console.error(err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}

export { errorHandler };
