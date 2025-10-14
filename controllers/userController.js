const User = require("../models/user");

// @desc    Get user by ID (Public info only)
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: [
                "id",
                "email",
                "username",
                "fullName",
                "phone",
                "role",
                "createdAt",
            ], // Only public fields
            where: { isActive: true },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get user by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// @desc    Search users by username, name or email
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must be at least 2 characters long",
            });
        }

        const offset = (page - 1) * limit;
        const { Op } = require("sequelize");

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
                "id",
                "username",
                "email",
                "fullName",
                "phone",
                "role",
                "createdAt",
            ],
            limit: parseInt(limit),
            offset,
            order: [["username", "ASC"]],
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalUsers: count,
                    hasNextPage: page < Math.ceil(count / limit),
                    hasPrevPage: page > 1,
                },
            },
        });
    } catch (error) {
        console.error("Search users error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    getUserById,
    searchUsers,
};
