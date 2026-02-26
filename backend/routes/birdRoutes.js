const express = require('express');
const router = express.Router();
const BirdController = require('../controllers/birdController');

// @route   GET /api/guess
// @desc    Get all guesses
// @access  Public
router.get('/', BirdController.getAllGuess);

// @route   GET /api/guess/:id
// @desc    Get guess by birdguess_id
// @access  Public
router.get('/:id', BirdController.getGuess);

// @route   POST /api/guess
// @desc    Create new guess
// @access  Public
router.post('/', BirdController.createGuess);

module.exports = router;
