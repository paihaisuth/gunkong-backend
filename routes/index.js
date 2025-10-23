const express = require('express')
const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const profileRoutes = require('./profileRoutes')
const adminRoutes = require('./adminRoutes')
const roomRoutes = require('./roomRoutes')

const router = express.Router()

// Health check endpoint (must be first, before auth middleware)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Gunkong Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            authentication: {
                register: 'POST /api/register',
                login: 'POST /api/login',
                logout: 'POST /api/logout',
                refreshToken: 'POST /api/refresh-token',
                googleLogin: 'GET /api/google',
                googleCallback: 'GET /api/google/callback',
                me: 'GET /api/me',
                changePassword: 'PUT /api/change-password',
            },
            users: {
                search: 'GET /api/user/search',
                getProfile: 'GET /api/user/:id',
            },
            profile: {
                getProfile: 'GET /api/profile',
                updateProfile: 'PUT /api/profile',
                deleteAccount: 'DELETE /api/profile',
            },
            rooms: {
                createRoom: 'POST /api/room',
                getMyRooms: 'GET /api/room/me',
                getRoomByCode: 'GET /api/room/:roomCode',
                getRoomById: 'GET /api/room/:id',
            },
            admin: {
                getAllUsers: 'GET /api/admin/users',
                getUserById: 'GET /api/admin/user/:id',
                updateUser: 'PUT /api/admin/user/:id',
                deleteUser: 'DELETE /api/admin/users/:id',
                getUserStats: 'GET /api/admin/users/stats',
            },
            system: {
                health: 'GET /api/health',
            },
        },
        features: {
            autoRefreshToken: true,
            jwtExpiry: {
                accessToken: '1h',
                refreshToken: '7d',
            },
        },
    })
})

// API routes
router.use('/', authRoutes) // Authentication endpoints at root level
router.use('/user', userRoutes) // Public user endpoints
router.use('/profile', profileRoutes) // User profile management
router.use('/room', roomRoutes) // Transaction room endpoints
router.use('/admin', adminRoutes) // Admin management endpoints

module.exports = router
