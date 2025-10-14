const { DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')
const { sequelize } = require('../config/database')

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true,
            },
            set(value) {
                this.setDataValue('email', value.toLowerCase().trim())
            },
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 100],
                notEmpty: true,
            },
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        fullName: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: 'full_name',
            validate: {
                len: [0, 200],
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password',
            validate: {
                len: [6, 255],
            },
        },
        role: {
            type: DataTypes.ENUM('USER', 'ADMIN'),
            allowNull: false,
            defaultValue: 'USER',
        },
        bankAccountNumber: {
            type: DataTypes.STRING(12),
            allowNull: true,
            field: 'bank_account_number',
            validate: {
                isNumeric: true,
                len: [10, 12],
            },
        },
        bankCode: {
            type: DataTypes.STRING(3),
            allowNull: true,
            field: 'bank_code',
            validate: {
                isNumeric: true,
                len: [3, 3],
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    },
    {
        timestamps: true,
        underscored: true,
        tableName: 'users',
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 12)
                }
            },
        },
    }
)

User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
}

User.prototype.isAdmin = function () {
    return this.role === 'ADMIN'
}

User.prototype.hasBankAccount = function () {
    return !!(this.bankAccountNumber && this.bankCode)
}

module.exports = User
