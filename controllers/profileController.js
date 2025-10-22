const { User } = require('../models')
const {
    responseFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['email', 'username', 'fullName', 'phone'],
        })

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        return responseFormat(
            res,
            200,
            true,
            'Profile Retrieved Successfully',
            'User profile has been retrieved successfully',
            user
        )
    } catch (error) {
        console.error('Get profile error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while retrieving profile',
            error.message
        )
    }
}

const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body

        const user = await User.findByPk(req.user.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        // Update user fields
        await user.update({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            phone: phone || user.phone,
        })

        // Remove password from response
        const userResponse = { ...user.toJSON() }
        delete userResponse.password

        return responseFormat(
            res,
            200,
            true,
            'Profile Updated Successfully',
            'User profile has been updated successfully',
            userResponse
        )
    } catch (error) {
        console.error('Update profile error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while updating profile',
            error.message
        )
    }
}

const deleteAccount = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        await user.update({ isActive: false })

        return responseFormat(
            res,
            200,
            true,
            'Account Deactivated Successfully',
            'Your account has been deactivated successfully',
            null
        )
    } catch (error) {
        console.error('Delete account error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error occurred while deleting account',
            error.message
        )
    }
}

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount,
}
