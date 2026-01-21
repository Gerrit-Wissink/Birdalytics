const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

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

module.exports = router;
