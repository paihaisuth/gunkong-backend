const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const profileRoutes = require("./profileRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

// API routes
router.use("/", authRoutes); // Authentication endpoints at root level
router.use("/users", userRoutes); // Public user endpoints
router.use("/profile", profileRoutes); // User profile management
router.use("/admin", adminRoutes); // Admin management endpoints

router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Gunkong Backend API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        endpoints: {
            authentication: {
                register: "POST /api/register",
                login: "POST /api/login",
                logout: "POST /api/logout",
                me: "GET /api/me",
                changePassword: "PUT /api/change-password",
            },
            users: {
                search: "GET /api/users/search",
                getProfile: "GET /api/users/:id",
            },
            profile: {
                getProfile: "GET /api/profile",
                updateProfile: "PUT /api/profile",
                deleteAccount: "DELETE /api/profile",
            },
            admin: {
                getAllUsers: "GET /api/admin/users",
                getUserById: "GET /api/admin/users/:id",
                updateUser: "PUT /api/admin/users/:id",
                deleteUser: "DELETE /api/admin/users/:id",
                getUserStats: "GET /api/admin/stats/users",
            },
            system: {
                health: "GET /api/health",
            },
        },
    });
});

module.exports = router;
