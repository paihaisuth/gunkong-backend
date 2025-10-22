const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { errorResponseFormat } = require('../utils/responseFormat')

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
            return errorResponseFormat(
                res,
                401,
                'Access token is required',
                'NO_TOKEN_PROVIDED'
            )
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
                    'updatedAt',
                ],
            })

            if (!user) {
                return errorResponseFormat(
                    res,
                    401,
                    'User not found',
                    'USER_NOT_FOUND'
                )
            }

            if (!user.isActive) {
                return errorResponseFormat(
                    res,
                    401,
                    'Your account has been deactivated',
                    'ACCOUNT_DEACTIVATED'
                )
            }

            req.user = user
            next()
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log('Token expired error:', error)
                return errorResponseFormat(
                    res,
                    401,
                    'Access token has expired',
                    'TOKEN_EXPIRED'
                )
            }

            if (error.name === 'JsonWebTokenError') {
                return errorResponseFormat(
                    res,
                    401,
                    'Invalid access token',
                    'INVALID_TOKEN'
                )
            }

            return errorResponseFormat(
                res,
                401,
                'Could not authenticate with provided token',
                'AUTHENTICATION_FAILED'
            )
        }
    } catch (error) {
        console.error('Auth middleware error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred during authentication',
            error.message
        )
    }
}

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponseFormat(
                res,
                401,
                'Authentication required',
                'AUTHENTICATION_REQUIRED'
            )
        }

        if (!roles.includes(req.user.role)) {
            return errorResponseFormat(
                res,
                403,
                'You do not have permission to perform this action',
                'FORBIDDEN'
            )
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
                        'updatedAt',
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

const protectWithRefresh = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1]
        const refreshToken = req.headers['x-refresh-token']

        if (!token) {
            return errorResponseFormat(
                res,
                401,
                'Access token is required',
                'NO_TOKEN_PROVIDED'
            )
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
                    'updatedAt',
                ],
            })

            if (!user) {
                return errorResponseFormat(
                    res,
                    401,
                    'User not found',
                    'USER_NOT_FOUND'
                )
            }

            if (!user.isActive) {
                return errorResponseFormat(
                    res,
                    401,
                    'Your account has been deactivated',
                    'ACCOUNT_DEACTIVATED'
                )
            }

            req.user = user
            next()
        } catch (error) {
            if (error.name === 'TokenExpiredError' && refreshToken) {
                try {
                    const refreshDecoded = jwt.verify(
                        refreshToken,
                        process.env.JWT_REFRESH_SECRET ||
                            'your-refresh-secret-key'
                    )

                    if (refreshDecoded.type !== 'refresh') {
                        throw new Error('Invalid token type')
                    }

                    const user = await User.findByPk(refreshDecoded.userId, {
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
                            'updatedAt',
                        ],
                    })

                    if (!user || !user.isActive) {
                        throw new Error('User not found or inactive')
                    }

                    const {
                        generateTokens,
                    } = require('../controllers/authController')
                    const newTokens = generateTokens(user)

                    res.set('X-New-Access-Token', newTokens.accessToken)
                    res.set('X-New-Refresh-Token', newTokens.refreshToken)

                    req.user = user
                    req.tokenRefreshed = true
                    next()
                } catch (refreshError) {
                    return errorResponseFormat(
                        res,
                        401,
                        'Refresh token is invalid or expired',
                        'INVALID_REFRESH_TOKEN'
                    )
                }
            } else {
                if (error.name === 'TokenExpiredError') {
                    return errorResponseFormat(
                        res,
                        401,
                        'Access token expired and no refresh token provided',
                        'TOKEN_EXPIRED_NO_REFRESH'
                    )
                }

                return errorResponseFormat(
                    res,
                    401,
                    'Invalid access token',
                    'INVALID_TOKEN'
                )
            }
        }
    } catch (error) {
        console.error('Enhanced auth middleware error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error during authentication',
            error.message
        )
    }
}

module.exports = {
    protect,
    restrictTo,
    optionalAuth,
    protectWithRefresh,
}
