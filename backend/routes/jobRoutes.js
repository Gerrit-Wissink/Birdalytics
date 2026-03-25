const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');

// @route   GET /api/jobs
// @desc    Get all jobs
// @access  Public
router.get('/', JobController.getAllJobs);

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get('/:id', JobController.getJob);

module.exports = router;
