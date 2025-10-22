const crypto = require('crypto')
const { Op } = require('sequelize')
const { Room, User } = require('../models')
const { title } = require('process')
const {
    responseFormat,
    responseArrayFormat,
    errorResponseFormat,
} = require('../utils/responseFormat')

const ROOM_CODE_RETRY_LIMIT = 5

const createUniqueRoomCode = async () => {
    for (let attempt = 0; attempt < ROOM_CODE_RETRY_LIMIT; attempt += 1) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase()
        const existing = await Room.findOne({
            where: { roomCode: code },
            attributes: ['id'],
        })

        if (!existing) {
            return code
        }
    }

    throw new Error('Unable to generate unique room code')
}

const canAccessRoom = (user, room) => {
    if (!user || !room) return false

    if (user.role === 'ADMIN') return true

    const userId = user.id
    return (
        room.creatorId === userId ||
        room.buyerId === userId ||
        room.sellerId === userId
    )
}

const createRoom = async (req, res) => {
    try {
        const {
            buyerId,
            sellerId = req.user.id,
            itemTitle,
            itemDescription,
            quantity,
            itemPriceCents,
            shippingFeeCents = 0,
            platformFeeCents = 0,
            currency = 'THB',
            itemImages = [],
        } = req.body

        if (!buyerId && !sellerId) {
            return errorResponseFormat(
                res,
                400,
                'Either buyerId or sellerId must be provided',
            )
        }

        const roomCode = await createUniqueRoomCode()

        const normalizedQuantity = Number(quantity)
        const normalizedItemPrice = Number(itemPriceCents)
        const normalizedShipping = Number(shippingFeeCents)
        const normalizedPlatform = Number(platformFeeCents)

        const totalCents =
            normalizedItemPrice * normalizedQuantity +
            normalizedShipping +
            normalizedPlatform

        const room = await Room.create({
            roomCode,
            creatorId: req.user.id,
            buyerId: buyerId || null,
            sellerId: sellerId || null,
            status: Room.STATUS[0],
            itemTitle,
            itemDescription,
            quantity: normalizedQuantity,
            itemPriceCents: normalizedItemPrice,
            shippingFeeCents: normalizedShipping,
            platformFeeCents: normalizedPlatform,
            totalCents,
            currency,
            itemImages: Array.isArray(itemImages) ? itemImages : [],
            paymentStatus: Room.PAYMENT_STATUS[0],
        })

        return responseFormat(
            res,
            201,
            true,
            'Transaction Room Created',
            'Transaction room created successfully',
            room,
        )
    } catch (error) {
        console.error('Create room error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error while creating transaction room',
            error.message,
        )
    }
}

const getRoomById = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'username', 'fullName', 'email'],
                    required: false,
                },
                {
                    model: User,
                    as: 'buyer',
                    attributes: ['id', 'username', 'fullName', 'email'],
                    required: false,
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName', 'email'],
                },
            ],
        })

        if (!room) {
            return errorResponseFormat(res, 404, 'Transaction room not found')
        }

        if (!canAccessRoom(req.user, room)) {
            return errorResponseFormat(
                res,
                403,
                'You do not have access to this transaction room',
            )
        }
        return responseFormat(
            res,
            200,
            true,
            'Transaction Room Retrieved',
            'Transaction room retrieved successfully',
            room,
        )
    } catch (error) {
        console.error('Get room by ID error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error while retrieving transaction room',
            error.message,
        )
    }
}

const getRoomByCode = async (req, res) => {
    try {
        const roomCode = req.params.roomCode.toUpperCase()
        const room = await Room.findOne({
            where: { roomCode },
            include: [
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'username', 'fullName', 'email'],
                    required: false,
                },
                {
                    model: User,
                    as: 'buyer',
                    attributes: ['id', 'username', 'fullName', 'email'],
                    required: false,
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName', 'email'],
                },
            ],
        })

        if (!room) {
            return errorResponseFormat(res, 404, 'Transaction room not found')
        }

        if (!canAccessRoom(req.user, room)) {
            return errorResponseFormat(
                res,
                403,
                'You do not have access to this transaction room',
            )
        }

        return responseFormat(
            res,
            200,
            true,
            'Transaction Room Retrieved',
            'Transaction room retrieved successfully by code',
            room,
        )
    } catch (error) {
        console.error('Get room by code error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error while retrieving transaction room',
            error.message,
        )
    }
}

const getMyRooms = async (req, res) => {
    try {
        const { status, page = 1, per_page = 10 } = req.query

        const paginationLimit = Math.min(parseInt(per_page, 10) || 10, 50)
        const offset = ((parseInt(page, 10) || 1) - 1) * paginationLimit

        const whereClause = {
            [Op.or]: [
                { creatorId: req.user.id },
                { buyerId: req.user.id },
                { sellerId: req.user.id },
            ],
        }

        if (status) {
            const normalizedStatus = status.toUpperCase()
            if (!Room.STATUS.includes(normalizedStatus)) {
                return errorResponseFormat(
                    res,
                    400,
                    'Invalid transaction room status filter',
                )
            }
            whereClause.status = normalizedStatus
        }

        const { count, rows } = await Room.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'username', 'fullName'],
                    required: false,
                },
                {
                    model: User,
                    as: 'buyer',
                    attributes: ['id', 'username', 'fullName'],
                    required: false,
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: paginationLimit,
            offset,
        })

        const totalPages = Math.ceil(count / paginationLimit)
        const currentPage = parseInt(page, 10) || 1

        return res.status(200).json({
            apiVersion: '0.1.0',
            data: {
                success: true,
                title: 'My Rooms Retrieved Successfully',
                message: `Found ${count} room(s) matching your criteria`,
                items: rows,
                pagination: {
                    total: count,
                    page: currentPage,
                    perPage: paginationLimit,
                    totalPages: totalPages,
                },
            },
        })
    } catch (error) {
        console.error('Get my rooms error:', error)
        return errorResponseFormat(
            res,
            500,
            'Server error while retrieving transaction rooms',
            error.message,
        )
    }
}

module.exports = {
    createRoom,
    getRoomById,
    getRoomByCode,
    getMyRooms,
}
