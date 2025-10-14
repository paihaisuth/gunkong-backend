const errorHandler = (err, req, res, next) => {
    console.error('Error:', err)

    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map((error) => ({
            field: error.path,
            message: error.message,
        }))
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors,
        })
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0].path
        return res.status(400).json({
            success: false,
            message: `${field} already exists`,
        })
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference to related data',
        })
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        })
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
        })
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
}

const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`)
    error.statusCode = 404
    next(error)
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
}
