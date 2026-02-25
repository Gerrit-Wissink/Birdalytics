const express = require('express');
const router = express.Router();
const SpeciesController = require('../controllers/speciesController');

// @route   GET /api/species
// @desc    Get all species
// @access  Public
router.get('/', SpeciesController.getAllSpecies);

// @route   GET /api/species/:id
// @desc    Get species by ID
// @access  Public
router.get('/:id', SpeciesController.getSpecies);

module.exports = router;
