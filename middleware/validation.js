const { body, validationResult } = require('express-validator')
const { errorResponseFormat } = require('../utils/responseFormat')

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return errorResponseFormat(
            res,
            400,
            'Validation failed',
            errors.array()
        )
    }
    next()
}

const validateUserRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('username')
        .isLength({ min: 3, max: 100 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage(
            'Username must be 3-100 characters and contain only letters, numbers, and underscores'
        ),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('fullName')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Full name cannot exceed 200 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('role')
        .optional()
        .isIn(['USER', 'ADMIN'])
        .withMessage('Role must be either USER or ADMIN'),
    body('bankAccountNumber')
        .optional()
        .isNumeric()
        .isLength({ min: 10, max: 12 })
        .withMessage('Bank account number must be 10-12 digits'),
    body('bankCode')
        .optional()
        .isNumeric()
        .isLength({ min: 3, max: 3 })
        .withMessage('Bank code must be exactly 3 digits'),
    handleValidationErrors,
]

const validateUserLogin = [
    body('password').notEmpty().withMessage('Password is required'),
    body().custom((value) => {
        if (!value.email && !value.username) {
            throw new Error('Either email or username is required')
        }
        return true
    }),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('username')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Username must be 3-100 characters'),
    handleValidationErrors,
]

const validateUserUpdate = [
    body('fullName')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Full name cannot exceed 200 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('bankAccountNumber')
        .optional()
        .isNumeric()
        .isLength({ min: 10, max: 12 })
        .withMessage('Bank account number must be 10-12 digits'),
    body('bankCode')
        .optional()
        .isNumeric()
        .isLength({ min: 3, max: 3 })
        .withMessage('Bank code must be exactly 3 digits'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
    handleValidationErrors,
]

const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Password confirmation does not match new password')
        }
        return true
    }),
    handleValidationErrors,
]

const validateRoomCreation = [
    body('buyerId')
        .optional()
        .isUUID()
        .withMessage('buyerId must be a valid UUID'),
    body('sellerId')
        .optional()
        .isUUID()
        .withMessage('sellerId must be a valid UUID'),
    body('itemTitle')
        .isLength({ min: 3, max: 200 })
        .withMessage('Item title must be between 3 and 200 characters'),
    body('itemDescription')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Item description cannot exceed 2000 characters'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('itemPriceCents')
        .isInt({ min: 1 })
        .withMessage('Item price must be at least 1 cent'),
    body('shippingFeeCents')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Shipping fee must be zero or greater'),
    body('platformFeeCents')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Platform fee must be zero or greater'),
    body('currency')
        .optional()
        .isIn(['THB'])
        .withMessage('Currency must be THB'),
    body('itemImages')
        .optional()
        .isArray()
        .withMessage('Item images must be an array'),
    body('itemImages.*')
        .optional()
        .isURL()
        .withMessage('Item image entries must be valid URLs'),
    handleValidationErrors,
]

// UUID validation for params
const validateUUID = [
    body('id').optional().isUUID().withMessage('Invalid ID format'),
    handleValidationErrors,
]

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateUserUpdate,
    validatePasswordChange,
    validateRoomCreation,
    validateUUID,
    handleValidationErrors,
}
