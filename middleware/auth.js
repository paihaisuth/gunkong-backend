const jwt = require('jsonwebtoken')
const User = require('../models/user')

const protect = async (req, res, next) => {
    try {
        let token

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided',
            })
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'your-secret-key'
            )

            const user = await User.findByPk(decoded.userId, {
                attributes: [
                    'id',
                    'email', 
                    'username',
                    'fullName',
                    'phone',
                    'role',
                    'bankAccountNumber',
                    'bankCode',
                    'isActive',
                    'createdAt',
                    'updatedAt'
                ],
            })

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user not found',
                })
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated',
                })
            }

            req.user = user
            next()
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
            })
        }
    } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error in authentication',
            error: error.message,
        })
    }
}

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            })
        }
        next()
    }
}

const optionalAuth = async (req, res, next) => {
    try {
        let token

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (token) {
            try {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || 'your-secret-key'
                )
                const user = await User.findByPk(decoded.userId, {
                    attributes: [
                        'id',
                        'email', 
                        'username',
                        'fullName',
                        'phone',
                        'role',
                        'bankAccountNumber',
                        'bankCode',
                        'isActive',
                        'createdAt',
                        'updatedAt'
                    ],
                })

                if (user && user.isActive) {
                    req.user = user
                }
            } catch (error) {
                console.log('Invalid token in optional auth:', error.message)
            }
        }

        next()
    } catch (error) {
        console.error('Optional auth middleware error:', error)
        next()
    }
}

module.exports = {
    protect,
    restrictTo,
    optionalAuth,
}
