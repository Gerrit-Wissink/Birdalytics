const express = require('express');
const router = express.Router();
const RecordController = require('../controllers/recordController');

// @route   GET /api/record
// @desc    Get all records
// @access  Public
router.get('/', RecordController.getAllRecords);

// @route   GET /api/record/csv
// @desc    Get all records as CSV
// @access  Public
router.get('/csv', RecordController.getCsvRecords);

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

// @route   PUT /api/record/manual/:id
// @desc    Update record's manual_bird
// @access  Public
router.put('/manual/:id', RecordController.setManualBird);

module.exports = router;
