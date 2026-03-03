const express = require('express');
const router = express.Router();
const BoxController = require('../controllers/boxController');

// @route   GET /api/boxes
// @desc    Get all boxes
// @access  Public
router.get('/', BoxController.getAllBoxes);


// @route   GET /api/boxes/record
// @desc    Get all boxes and all related info
// @access  Public
router.get('/record', BoxController.getAllBoxesInfo);

// @route   GET /api/boxes/:id
// @desc    Get box by ID
// @access  Public
router.get('/:id', BoxController.getBox);

// @route   GET /api/boxes/record/:id
// @desc    Get box by ID with all related info
// @access  Public
router.get('/record/:id', BoxController.getBoxInfo);

// @route   POST /api/boxes
// @desc    Create new box
// @access  Public
router.post('/', BoxController.createBox);

// @route   PUT /api/boxes/:id
// @desc    Update box
// @access  Public
router.put('/:id', BoxController.updateBox);

// @route   DELETE /api/boxes/:id
// @desc    Delete box
// @access  Public
router.delete('/:id', BoxController.deleteBox);

module.exports = router;
