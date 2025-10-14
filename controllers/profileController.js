const User = require("../models/user");

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
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
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update user fields
        await user.update({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            phone: phone || user.phone,
        });

        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: userResponse,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// @desc    Delete user account (self)
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Soft delete by setting isActive to false
        await user.update({ isActive: false });

        res.json({
            success: true,
            message: "Account deactivated successfully",
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount,
};
