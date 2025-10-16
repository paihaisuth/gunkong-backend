const User = require('../models/user')
const {
    responseFormat,
    responseArrayFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

// @desc    Get user by ID (Public info only)
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: [
                'id',
                'email',
                'username',
                'fullName',
                'phone',
                'role',
                'createdAt',
            ], // Only public fields
            where: { isActive: true },
        })

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        return responseFormat(
            res,
            200,
            true,
            'User Retrieved Successfully',
            'User details have been retrieved successfully',
            user
        )
    } catch (error) {
        console.error('Get user by ID error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while retrieving user',
            error.message
        )
    }
}

// @desc    Search users by username, name or email
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query

        if (!q || q.trim().length < 2) {
            return errorResponseFormat(
                res,
                400,
                'Search query must be at least 2 characters long'
            )
        }

        const offset = (page - 1) * limit
        const { Op } = require('sequelize')

        const { count, rows: users } = await User.findAndCountAll({
            where: {
                [Op.and]: [
                    { isActive: true },
                    {
                        [Op.or]: [
                            { username: { [Op.iLike]: `%${q}%` } },
                            { email: { [Op.iLike]: `%${q}%` } },
                            { fullName: { [Op.iLike]: `%${q}%` } },
                        ],
                    },
                ],
            },
            attributes: [
                'id',
                'username',
                'email',
                'fullName',
                'phone',
                'role',
                'createdAt',
            ],
            limit: parseInt(limit),
            offset,
            order: [['username', 'ASC']],
        })

        return responseArrayFormat(
            res,
            200,
            true,
            users,
            'Users Search Completed',
            `Found ${count} user(s) matching your search criteria`
        )
    } catch (error) {
        console.error('Search users error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while searching users',
            error.message
        )
    }
}

module.exports = {
    getUserById,
    searchUsers,
}
