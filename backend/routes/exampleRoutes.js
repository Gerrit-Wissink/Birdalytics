const express = require('express');
const router = express.Router();
const ExampleController = require('../controllers/exampleController');

// @route   GET /api/examples
// @desc    Get all examples
// @access  Public
router.get('/', ExampleController.getAllExamples);

// @route   GET /api/examples/:id
// @desc    Get example by ID
// @access  Public
router.get('/:id', ExampleController.getExample);

// @route   POST /api/examples
// @desc    Create new example
// @access  Public
router.post('/', ExampleController.createExample);

// @route   PUT /api/examples/:id
// @desc    Update example
// @access  Public
router.put('/:id', ExampleController.updateExample);

// @route   DELETE /api/examples/:id
// @desc    Delete example
// @access  Public
router.delete('/:id', ExampleController.deleteExample);

module.exports = router;
