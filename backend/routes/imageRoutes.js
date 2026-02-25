const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// @route   GET /api/images
// @desc    Get all images
// @access  Public
router.get('/', ImageController.getAllImages);

// @route   GET /api/images/:id
// @desc    Get image by ID
// @access  Public
router.get('/:id', ImageController.getImage);

// @route   GET /api/images/:id
// @desc    Get image by ID
// @access  Public
router.get('/info/:id', ImageController.getImageInfo);

// @route   POST /api/images
// @desc    Create new image
// @access  Public
router.post('/', ImageController.createImage);

// @route   DELETE /api/images/:id
// @desc    Delete image
// @access  Public
router.delete('/:id', ImageController.deleteImage);

module.exports = router;
