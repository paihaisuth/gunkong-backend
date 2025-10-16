const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const {
    responseFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

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
            return errorResponseFormat(
                res,
                400,
                'User with this email or username already exists'
            )
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

        responseFormat(
            res,
            201,
            true,
            'Registration Successful',
            'User has been registered successfully',
            {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred during registration',
            error.message
        )
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
            return errorResponseFormat(res, 401, 'Invalid credentials provided')
        }

        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
            return errorResponseFormat(res, 401, 'Invalid credentials provided')
        }

        const tokens = generateTokens(user)

        return responseFormat(
            res,
            200,
            true,
            'Login Successful',
            'User has been authenticated successfully',
            {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            }
        )

        // res.json({
        //     apiVersion: '0.1.0',
        //     data: {
        //         title: 'Login Successful',
        //         description: 'User has been authenticated successfully',
        //         item: {
        //             success: true,
        //             accessToken: tokens.accessToken,
        //             refreshToken: tokens.refreshToken,
        //         },
        //     },
        // })
    } catch (error) {
        console.error('Login error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred during login',
            error.message
        )
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
            return errorResponseFormat(res, 404, 'User not found')
        }

        return responseFormat(
            res,
            200,
            true,
            'User Profile',
            'Current user profile information',
            user
        )
        // res.json({
        //     apiVersion: '0.1.0',
        //     data: {
        //         title: 'User Profile',
        //         description: 'Current user profile information',
        //         item: {
        //             success: true,
        //             user: user,
        //         },
        //     },
        // })
    } catch (error) {
        console.error('Get me error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while fetching user profile',
            error.message
        )
    }
}

// @desc    Logout user (invalidate token - client-side)
// @route   POST /logout
// @access  Private
// This will be handled client-side by removing the token from storage (optional case)
const logout = async (req, res) => {
    return responseFormat(
        res,
        200,
        true,
        'Logout Successful',
        'User has been logged out successfully',
        {
            message:
                'Logout successful. Please remove token from client storage.',
        }
    )
}

// @desc    Change user password
// @route   PUT /change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        const user = await User.findByPk(req.user.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(
            currentPassword
        )
        if (!isCurrentPasswordValid) {
            return errorResponseFormat(
                res,
                400,
                'Current password is incorrect'
            )
        }

        // Update password
        await user.update({ password: newPassword })

        return responseFormat(
            res,
            200,
            true,
            'Password Changed Successfully',
            'Your password has been changed successfully',
            { message: 'Password changed successfully' }
        )
    } catch (error) {
        console.error('Change password error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while changing password',
            error.message
        )
    }
}

// @desc    Refresh access token
// @route   POST /refresh-token
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return errorResponseFormat(
                res,
                400,
                'Refresh token is required to generate new access token'
            )
        }

        // Verify refresh token
        let decoded
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            )
        } catch (error) {
            return errorResponseFormat(
                res,
                401,
                'The provided refresh token is invalid or expired'
            )
        }

        // Check if it's actually a refresh token
        if (decoded.type !== 'refresh') {
            return errorResponseFormat(
                res,
                401,
                'The provided token is not a refresh token'
            )
        }

        // Find user
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] },
        })

        if (!user || !user.isActive) {
            return errorResponseFormat(
                res,
                401,
                'User associated with this token no longer exists or is inactive'
            )
        }

        // Generate new tokens with user data embedded
        const tokens = generateTokens(user)

        return responseFormat(
            res,
            200,
            true,
            'Token Refreshed Successfully',
            'New access token generated successfully',
            {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            }
        )
    } catch (error) {
        console.error('Refresh token error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while refreshing token',
            error.message
        )
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
