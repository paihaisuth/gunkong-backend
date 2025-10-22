const express = require('express')
const router = express.Router()
const roomController = require('../controllers/roomController')
const authMiddleware = require('../middleware/auth')
const validation = require('../middleware/validation')

router.use(authMiddleware.protectWithRefresh)

router.post('/', validation.validateRoomCreation, roomController.createRoom)

router.get('/list', roomController.getMyRooms)
router.get('/:roomCode', roomController.getRoomByCode)
router.get('/:id', roomController.getRoomById)

module.exports = router
