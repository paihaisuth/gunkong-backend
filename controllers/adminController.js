const { User } = require('../models')
const {
    responseFormat,
    responseArrayFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

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

        return responseArrayFormat(
            res,
            200,
            true,
            users,
            'Users Retrieved Successfully',
            'All users have been retrieved successfully'
        )
    } catch (error) {
        console.error('Get all users error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while retrieving users',
            error.message
        )
    }
}

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

const updateUser = async (req, res) => {
    try {
        const { fullName, phone, role, bankAccountNumber, bankCode, isActive } =
            req.body

        const user = await User.findByPk(req.params.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
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

        return responseFormat(
            res,
            200,
            true,
            'User Updated Successfully',
            'User has been updated successfully',
            userResponse
        )
    } catch (error) {
        console.error('Update user error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while updating user',
            error.message
        )
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        await user.update({ isActive: false })

        return responseFormat(
            res,
            200,
            true,
            'User Deleted Successfully',
            'User has been deactivated successfully',
            null
        )
    } catch (error) {
        console.error('Delete user error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while deleting user',
            error.message
        )
    }
}

const activateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        await user.update({ isActive: true })

        return responseFormat(
            res,
            200,
            true,
            'User Activated Successfully',
            'User has been activated successfully',
            null
        )
    } catch (error) {
        console.error('Activate user error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while activating user',
            error.message
        )
    }
}

const deactivateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        await user.update({ isActive: false })

        return responseFormat(
            res,
            200,
            true,
            'User Deactivated Successfully',
            'User has been deactivated successfully',
            null
        )
    } catch (error) {
        console.error('Deactivate user error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while deactivating user',
            error.message
        )
    }
}

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

        const statsData = {
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
        }

        return responseFormat(
            res,
            200,
            true,
            'User Statistics Retrieved Successfully',
            'User statistics have been retrieved successfully',
            statsData
        )
    } catch (error) {
        console.error('Get user stats error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while retrieving user statistics',
            error.message
        )
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
