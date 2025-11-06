const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('phone_number')
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Must be a valid phone number'),
  
  body('user_type')
    .isIn(['admin', 'manager', 'seller'])
    .withMessage('User type must be admin, manager, or seller'),
  
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  
  body('id_number')
    .trim()
    .notEmpty()
    .withMessage('ID number is required')
    .isLength({ max: 50 })
    .withMessage('ID number must not exceed 50 characters'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Change password validation
const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Zone validation
const validateZone = [
  body('zone_name')
    .trim()
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ max: 100 })
    .withMessage('Zone name must not exceed 100 characters'),
  
  body('zone_code')
    .trim()
    .notEmpty()
    .withMessage('Zone code is required')
    .isLength({ max: 20 })
    .withMessage('Zone code must not exceed 20 characters'),
  
  body('total_spaces')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total spaces must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
  
  handleValidationErrors
];

// Space validation
const validateSpace = [
  body('zone_id')
    .isInt({ min: 1 })
    .withMessage('Valid zone ID is required'),
  
  body('space_number')
    .trim()
    .notEmpty()
    .withMessage('Space number is required')
    .isLength({ max: 20 })
    .withMessage('Space number must not exceed 20 characters'),
  
  body('space_type')
    .isIn(['standard', 'premium', 'corner', 'storage'])
    .withMessage('Space type must be standard, premium, corner, or storage'),
  
  body('daily_rate')
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a positive number'),
  
  body('weekly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weekly rate must be a positive number'),
  
  body('monthly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly rate must be a positive number'),
  
  body('size_sqm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Size must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['available', 'occupied', 'reserved', 'maintenance'])
    .withMessage('Status must be available, occupied, reserved, or maintenance'),
  
  handleValidationErrors
];

// Allocation validation
const validateAllocation = [
  body('seller_id')
    .isInt({ min: 1 })
    .withMessage('Valid seller ID is required'),
  
  body('space_id')
    .isInt({ min: 1 })
    .withMessage('Valid space ID is required'),
  
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('allocation_type')
    .isIn(['daily', 'weekly', 'monthly', 'permanent'])
    .withMessage('Allocation type must be daily, weekly, monthly, or permanent'),
  
  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('allocation_id')
    .isInt({ min: 1 })
    .withMessage('Valid allocation ID is required'),
  
  body('seller_id')
    .isInt({ min: 1 })
    .withMessage('Valid seller ID is required'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('payment_method')
    .isIn(['mobile_money', 'cash', 'bank_transfer', 'card'])
    .withMessage('Payment method must be mobile_money, cash, bank_transfer, or card'),
  
  body('payment_period_start')
    .isISO8601()
    .withMessage('Payment period start must be a valid date'),
  
  body('payment_period_end')
    .isISO8601()
    .withMessage('Payment period end must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.payment_period_start)) {
        throw new Error('Payment period end must be after start');
      }
      return true;
    }),
  
  body('mobile_money_number')
    .if(body('payment_method').equals('mobile_money'))
    .notEmpty()
    .withMessage('Mobile money number is required for mobile money payments'),
  
  body('mobile_money_provider')
    .if(body('payment_method').equals('mobile_money'))
    .notEmpty()
    .withMessage('Mobile money provider is required for mobile money payments'),
  
  handleValidationErrors
];

// ID parameter validation
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date')
    .custom((value, { req }) => {
      if (value && req.query.date_from && new Date(value) < new Date(req.query.date_from)) {
        throw new Error('Date to must be after date from');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateChangePassword,
  validateZone,
  validateSpace,
  validateAllocation,
  validatePayment,
  validateIdParam,
  validatePagination,
  validateDateRange,
  handleValidationErrors
};