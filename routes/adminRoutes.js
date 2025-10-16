const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const authMiddleware = require('../middleware/auth')
const validation = require('../middleware/validation')

// All admin routes require authentication
router.use(authMiddleware.protect)

// TODO: Add admin role middleware when roles are implemented
// router.use(authMiddleware.restrictTo('admin'));

router.get('/users', adminController.getAllUsers)
router.get('/users/stats', adminController.getUserStats)
router.get('/user/:id', adminController.getUserById)
router.put(
    '/user/:id',
    validation.validateUserUpdate,
    adminController.updateUser,
)
router.delete('/users/:id', adminController.deleteUser)

router.put('/users/:id/activate', adminController.activateUser)
router.put('/users/:id/deactivate', adminController.deactivateUser)

module.exports = router
