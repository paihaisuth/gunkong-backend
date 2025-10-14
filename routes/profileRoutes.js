const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const authMiddleware = require('../middleware/auth')
const validation = require('../middleware/validation')

router.use(authMiddleware.protect)

router.get('/', profileController.getProfile)
router.put('/', validation.validateUserUpdate, profileController.updateProfile)
router.delete('/', profileController.deleteAccount)

module.exports = router
