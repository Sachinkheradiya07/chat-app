// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors)
            .map(e => e.message)
            .join(', ');
        return res.status(400).json({
            success: false,
            message: messages || 'Validation error'
        });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists. Please use a different value.`
        });
    }

    // JWT Errors
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
        });
    }

    // Custom API Error
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // Default Server Error
    res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
    });
};

// 404 Not Found Handler
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
};
