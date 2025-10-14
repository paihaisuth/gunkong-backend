const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

// Generate JWT access token (short-lived) with user data
const generateAccessToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName || user.full_name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive || user.is_active,
        type: 'access',
    }
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '15m',
    })
}

const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        type: 'refresh',
    }
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        {
            expiresIn: '7d',
        }
    )
}

const generateTokens = (user) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    }
}

// @desc    Register a new user
// @route   POST /register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, username, password, fullName, phone, role } = req.body

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }],
            },
        })

        if (existingUser) {
            return res.status(400).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Registration Failed',
                    description:
                        'User with this email or username already exists',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'email/username',
                                message:
                                    'User with this email or username already exists',
                                code: 'USER_EXISTS',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        const user = await User.create({
            email,
            username,
            password,
            fullName,
            phone,
            role: role || 'USER',
        })

        const tokens = generateTokens(user)

        res.status(201).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Registration Successful',
                description: 'User has been registered successfully',
                item: {
                    success: true,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Registration Error',
                description: 'Server error occurred during registration',
                item: {
                    success: false,
                    errors: [
                        {
                            field: 'server',
                            message: 'Server error during registration',
                            code: 'SERVER_ERROR',
                            value: error.message,
                        },
                    ],
                },
            },
        })
    }
}

// @desc    Login user
// @route   POST /login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, username, password } = req.body

        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: email || '' }, { username: username || '' }],
                isActive: true,
            },
        })

        if (!user) {
            return res.status(401).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Login Failed',
                    description: 'Invalid credentials provided',
                    success: false,
                    errors: [
                        {
                            field: 'credentials',
                            message: 'Invalid credentials',
                            code: 'INVALID_CREDENTIALS',
                            value: null,
                        },
                    ],
                },
            })
        }

        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Login Failed',
                    description: 'Invalid credentials provided',
                    success: false,
                    errors: [
                        {
                            field: 'password',
                            message: 'Invalid credentials',
                            code: 'INVALID_CREDENTIALS',
                            value: null,
                        },
                    ],
                },
            })
        }

        const tokens = generateTokens(user)

        res.json({
            apiVersion: '0.1.0',
            data: {
                title: 'Login Successful',
                description: 'User has been authenticated successfully',
                item: {
                    success: true,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            },
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Login Error',
                description: 'Server error occurred during login',
                item: {
                    success: false,
                    errors: [
                        {
                            field: 'server',
                            message: 'Server error during login',
                            code: 'SERVER_ERROR',
                            value: error.message,
                        },
                    ],
                },
            },
        })
    }
}

// @desc    Get current user info (from token)
// @route   GET /me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        })

        if (!user) {
            return res.status(404).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'User Not Found',
                    description: 'The requested user could not be found',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'user',
                                message: 'User not found',
                                code: 'USER_NOT_FOUND',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        res.json({
            apiVersion: '0.1.0',
            data: {
                title: 'User Profile',
                description: 'Current user profile information',
                item: {
                    success: true,
                    user: user,
                },
            },
        })
    } catch (error) {
        console.error('Get me error:', error)
        res.status(500).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Server Error',
                description:
                    'Server error occurred while fetching user profile',
                item: {
                    success: false,
                    errors: [
                        {
                            field: 'server',
                            message: 'Server error',
                            code: 'SERVER_ERROR',
                            value: error.message,
                        },
                    ],
                },
            },
        })
    }
}

// @desc    Logout user (invalidate token - client-side)
// @route   POST /logout
// @access  Private
// This will be handled client-side by removing the token from storage (optional case)
const logout = async (req, res) => {
    res.json({
        apiVersion: '0.1.0',
        data: {
            title: 'Logout Successful',
            description: 'User has been logged out successfully',
            item: {
                success: true,
                message:
                    'Logout successful. Please remove token from client storage.',
            },
        },
    })
}

// @desc    Change user password
// @route   PUT /change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        const user = await User.findByPk(req.user.id)

        if (!user) {
            return res.status(404).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'User Not Found',
                    description: 'The requested user could not be found',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'user',
                                message: 'User not found',
                                code: 'USER_NOT_FOUND',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(
            currentPassword
        )
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Password Change Failed',
                    description: 'Current password is incorrect',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'currentPassword',
                                message: 'Current password is incorrect',
                                code: 'INVALID_PASSWORD',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Update password
        await user.update({ password: newPassword })

        res.json({
            apiVersion: '0.1.0',
            data: {
                title: 'Password Changed',
                description: 'Password has been changed successfully',
                item: {
                    success: true,
                    message: 'Password changed successfully',
                },
            },
        })
    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Password Change Error',
                description: 'Server error occurred while changing password',
                item: {
                    success: false,
                    errors: [
                        {
                            field: 'server',
                            message: 'Server error',
                            code: 'SERVER_ERROR',
                            value: error.message,
                        },
                    ],
                },
            },
        })
    }
}

// @desc    Refresh access token
// @route   POST /refresh-token
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Refresh Token Required',
                    description:
                        'Refresh token is required to generate new access token',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'refreshToken',
                                message: 'Refresh token is required',
                                code: 'REFRESH_TOKEN_REQUIRED',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Verify refresh token
        let decoded
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            )
        } catch (error) {
            return res.status(401).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Invalid Refresh Token',
                    description:
                        'The provided refresh token is invalid or expired',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'refreshToken',
                                message: 'Invalid or expired refresh token',
                                code: 'INVALID_REFRESH_TOKEN',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Check if it's actually a refresh token
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'Invalid Token Type',
                    description: 'The provided token is not a refresh token',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'refreshToken',
                                message: 'Invalid token type',
                                code: 'INVALID_TOKEN_TYPE',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Find user
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] },
        })

        if (!user || !user.isActive) {
            return res.status(401).json({
                apiVersion: '0.1.0',
                data: {
                    title: 'User Not Found',
                    description:
                        'User associated with this token no longer exists or is inactive',
                    item: {
                        success: false,
                        errors: [
                            {
                                field: 'user',
                                message: 'User not found or inactive',
                                code: 'USER_NOT_FOUND',
                                value: null,
                            },
                        ],
                    },
                },
            })
        }

        // Generate new tokens with user data embedded
        const tokens = generateTokens(user)

        res.json({
            apiVersion: '0.1.0',
            data: {
                title: 'Token Refreshed',
                description: 'New access token generated successfully',
                item: {
                    success: true,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            },
        })
    } catch (error) {
        console.error('Refresh token error:', error)
        res.status(500).json({
            apiVersion: '0.1.0',
            data: {
                title: 'Token Refresh Error',
                description: 'Server error occurred while refreshing token',
                item: {
                    success: false,
                    errors: [
                        {
                            field: 'server',
                            message: 'Server error during token refresh',
                            code: 'SERVER_ERROR',
                            value: error.message,
                        },
                    ],
                },
            },
        })
    }
}

module.exports = {
    register,
    login,
    getMe,
    logout,
    changePassword,
    refreshToken,
}
