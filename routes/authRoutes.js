const express = require('express')
const router = express.Router()
const passport = require('passport')
const authController = require('../controllers/authController')
const validation = require('../middleware/validation')

router.post(
    '/register',
    validation.validateUserRegistration,
    authController.register
)
router.post('/login', validation.validateUserLogin, authController.login)
router.post('/logout', authController.logout)
router.post('/refresh-token', authController.refreshToken)

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get(
        '/google',
        passport.authenticate('google', { 
            scope: ['profile', 'email'],
            session: false 
        })
    )

    router.get(
        '/google/callback',
        passport.authenticate('google', { 
            failureRedirect: '/auth/google/failure',
            session: false 
        }),
        authController.googleAuthCallback
    )

    router.get('/google/failure', authController.googleAuthFailure)
}

const authMiddleware = require('../middleware/auth')

router.get('/me', authMiddleware.protectWithRefresh, authController.getMe)
router.put(
    '/change-password',
    authMiddleware.protectWithRefresh,
    validation.validatePasswordChange,
    authController.changePassword
)

module.exports = router
