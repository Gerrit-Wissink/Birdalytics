const express = require('express');
const router = express.Router();
const RecordController = require('../controllers/recordController');

// @route   GET /api/record
// @desc    Get all records
// @access  Public
router.get('/', RecordController.getAllRecords);

// @route   GET /api/record/:id
// @desc    Get record by ID
// @access  Public
router.get('/:id', RecordController.getRecord);

// @route   POST /api/record
// @desc    Create new record
// @access  Public
router.post('/', RecordController.createRecord);

// @route   PUT /api/record/:id
// @desc    Update record
// @access  Public
router.put('/:id', RecordController.updateRecord);

module.exports = router;
