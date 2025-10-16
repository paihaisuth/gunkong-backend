const User = require('../models/user')
const {
    responseFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
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

// @desc    Delete user account (self)
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id)

        if (!user) {
            return errorResponseFormat(res, 404, 'User not found')
        }

        // Soft delete by setting isActive to false
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
