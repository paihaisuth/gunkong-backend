const { body, validationResult } = require('express-validator')

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        })
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
    validateUUID,
    handleValidationErrors,
}
