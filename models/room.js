const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ROOM_STATUSES = [
    'CREATED',
    'PENDING_PAYMENT',
    'PAID',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
]

const PAYMENT_STATUSES = ['PENDING', 'HELD', 'RELEASED', 'REFUNDED']

const Room = sequelize.define(
    'Room',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        roomCode: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
            field: 'room_code',
        },
        creatorId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'creator_id',
        },
        buyerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'buyer_id',
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'seller_id',
        },
        status: {
            type: DataTypes.ENUM(...ROOM_STATUSES),
            allowNull: false,
            defaultValue: 'CREATED',
        },
        itemTitle: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'item_title',
        },
        itemDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'item_description',
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        },
        itemPriceCents: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'item_price_cents',
            validate: {
                min: 0,
            },
        },
        shippingFeeCents: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'shipping_fee_cents',
            validate: {
                min: 0,
            },
        },
        platformFeeCents: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'platform_fee_cents',
            validate: {
                min: 0,
            },
        },
        totalCents: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'total_cents',
            validate: {
                min: 0,
            },
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'THB',
        },
        itemImages: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'item_images',
        },
        shippingAddressId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'shipping_address_id',
        },
        trackingNumber: {
            type: DataTypes.STRING(120),
            allowNull: true,
            field: 'tracking_number',
        },
        paidAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'paid_at',
        },
        paymentVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'payment_verified_at',
        },
        paymentVerifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'payment_verified_by',
        },
        shippedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'shipped_at',
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at',
        },
        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'cancelled_at',
        },
        cancelledBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'cancelled_by',
        },
        cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'cancellation_reason',
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'expires_at',
        },
        closedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'closed_at',
        },
        paymentStatus: {
            type: DataTypes.ENUM(...PAYMENT_STATUSES),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'payment_status',
        },
    },
    {
        tableName: 'transaction_rooms',
        underscored: true,
        indexes: [
            { fields: ['room_code'], unique: true },
            { fields: ['creator_id'] },
            { fields: ['buyer_id'] },
            { fields: ['seller_id'] },
            { fields: ['status'] },
        ],
        hooks: {
            beforeValidate: (room) => {
                if (!room.totalCents) {
                    const basePrice =
                        (room.itemPriceCents || 0) * (room.quantity || 1)
                    room.totalCents =
                        basePrice +
                        (room.shippingFeeCents || 0) +
                        (room.platformFeeCents || 0)
                }
            },
        },
    }
)

Room.STATUS = ROOM_STATUSES
Room.PAYMENT_STATUS = PAYMENT_STATUSES

Room.associate = (models) => {
    Room.belongsTo(models.User, {
        foreignKey: 'sellerId',
        as: 'seller',
        allowNull: true,
    })
    Room.belongsTo(models.User, {
        foreignKey: 'buyerId',
        as: 'buyer',
        allowNull: true,
    })
    Room.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
    })
}

module.exports = Room
