const express = require('express')
const router = express.Router()
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

const authMiddleware = require('../middleware/auth')
router.use(authMiddleware.protectWithRefresh)

router.get('/me', authController.getMe)
router.put(
    '/change-password',
    validation.validatePasswordChange,
    authController.changePassword
)

module.exports = router
