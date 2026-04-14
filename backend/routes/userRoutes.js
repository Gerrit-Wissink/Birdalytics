const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

/* commenting out
// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', UserController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', UserController.getUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Public
router.post('/', UserController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Public
router.put('/:id', UserController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Public
router.delete('/:id', UserController.deleteUser);
*/

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', UserController.loginUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Private
router.post('/', authMiddleware, UserController.createUser);

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', authMiddleware, UserController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, UserController.getUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authMiddleware, UserController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', authMiddleware, UserController.deleteUser);

module.exports = router;
