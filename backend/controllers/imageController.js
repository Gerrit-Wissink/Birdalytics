const Image = require('../models/Image');

class ImageController {
    // Get all images
    static async getAllImages(req, res) {
        try {
            const images = await Image.findAll({
                order: [['timestamp', 'image_id']]
            });
            res.json({
                success: true,
                count: images.length,
                data: images
            });
        } catch (error) {
            console.error('Error in getAllImages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch images'
            });
        }
    }

    // Get single image
    static async getImage(req, res) {
        try {
            const { id } = req.params;
            const im = await Image.findByPk(id);

            if (!im) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }

            res.json({
                success: true,
                data: im
            });
        } catch (error) {
            console.error('Error in getImage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch image'
            });
        }
    }

    // Create new image
    static async createImage(req, res) {
        try {
            const { image, timestamp, file_size } = req.body;

            // Validation
            if (!image || !timestamp || !file_size) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide image, timestamp, file_size'
                });
            }

            const newImage = await Image.create({ image, timestamp, file_size });

            res.status(201).json({
                success: true,
                data: newImage
            });
        } catch (error) {
            console.error('Error in createImage:', error);
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create image'
            });
        }
    }

    // Delete image
    static async deleteImage(req, res) {
        try {
            const { id } = req.params;

            const image = await Image.findByPk(id);
            if (!image) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }

            await image.destroy();

            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteImage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete image'
            });
        }
    }
}

module.exports = ImageController;
