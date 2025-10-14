const User = require('../models/user')

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit

        const { count, rows: users } = await User.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
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

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalUsers: count,
                    hasNextPage: page < Math.ceil(count / limit),
                    hasPrevPage: page > 1,
                },
            },
        })
    } catch (error) {
        console.error('Get all users error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Get user by ID (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
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
                'bankAccountNumber',
                'bankCode',
                'isActive',
                'createdAt',
                'updatedAt',
            ],
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        res.json({
            success: true,
            data: user,
        })
    } catch (error) {
        console.error('Get user by ID error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { fullName, phone, role, bankAccountNumber, bankCode, isActive } =
            req.body

        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        const updateData = {
            fullName: fullName !== undefined ? fullName : user.fullName,
            phone: phone !== undefined ? phone : user.phone,
            bankAccountNumber:
                bankAccountNumber !== undefined
                    ? bankAccountNumber
                    : user.bankAccountNumber,
            bankCode: bankCode !== undefined ? bankCode : user.bankCode,
            isActive: isActive !== undefined ? isActive : user.isActive,
        }

        if (role !== undefined && req.user.role === 'ADMIN') {
            updateData.role = role
        }

        await user.update(updateData)

        const userResponse = {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            bankAccountNumber: user.bankAccountNumber,
            bankCode: user.bankCode,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
        delete userResponse.id

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse,
        })
    } catch (error) {
        console.error('Update user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        await user.update({ isActive: false })

        res.json({
            success: true,
            message: 'User deleted successfully',
        })
    } catch (error) {
        console.error('Delete user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Activate user (Admin)
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        await user.update({ isActive: true })

        res.json({
            success: true,
            message: 'User activated successfully',
        })
    } catch (error) {
        console.error('Activate user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Deactivate user (Admin)
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        await user.update({ isActive: false })

        res.json({
            success: true,
            message: 'User deactivated successfully',
        })
    } catch (error) {
        console.error('Deactivate user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

// @desc    Get user statistics (Admin)
// @route   GET /api/admin/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.count()
        const activeUsers = await User.count({ where: { isActive: true } })
        const inactiveUsers = await User.count({ where: { isActive: false } })

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentUsers = await User.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: thirtyDaysAgo,
                },
            },
        })

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                recentUsers,
                stats: {
                    activePercentage:
                        totalUsers > 0
                            ? ((activeUsers / totalUsers) * 100).toFixed(2)
                            : 0,
                    inactivePercentage:
                        totalUsers > 0
                            ? ((inactiveUsers / totalUsers) * 100).toFixed(2)
                            : 0,
                },
            },
        })
    } catch (error) {
        console.error('Get user stats error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        })
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    getUserStats,
}
