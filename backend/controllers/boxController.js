const sequelize = require('../config/database');
const BirdBoxes = require('../models/Birdboxes');

class BoxController {
    // Get all boxes
    static async getAllBoxes(req, res) {
        try {
            const boxes = await BirdBoxes.findAll({
                order: [['name', 'birdbox_id']]
            });
            res.json({
                success: true,
                count: boxes.length,
                data: boxes
            });
        } catch (error) {
            console.error('Error in getAllBoxes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch boxes'
            });
        }
    }

    // Get single box
    static async getBox(req, res) {
        try {
            const { id } = req.params;
            const box = await BirdBoxes.findByPk(id);

            if (!box) {
                return res.status(404).json({
                    success: false,
                    error: 'Box not found'
                });
            }

            res.json({
                success: true,
                data: box
            });
        } catch (error) {
            console.error('Error in getBox:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch box'
            });
        }
    }

    // Create new box
    static async createBox(req, res) {
        try {
            const { name, latitide, longitude, field_notes } = req.body;

            // Validation
            if (!name || !latitide || !longitude) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide name, latitide, and longitude'
                });
            }

            // Check if box already exists
            const existingBox = await BirdBoxes.findOne({
                attributes: ['birdbox_id'],
                where: { name: name }
            });
            if (existingBox) {
                return res.status(400).json({
                    success: false,
                    error: 'Box with this name already exists'
                });
            }

            const newBox = await BirdBoxes.create({ name, latitide, longitude, field_notes });

            res.status(201).json({
                success: true,
                data: newBox
            });
        } catch (error) {
            console.error('Error in createBox:', error);
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create box'
            });
        }
    }

    // Update box
    static async updateBox(req, res) {
        try {
            const { id } = req.params;
            const { name, latitide, longitude, field_notes } = req.body;

            const box = await BirdBoxes.findByPk(id);
            if (!box) {
                return res.status(404).json({
                    success: false,
                    error: 'Box not found'
                });
            }

            // Check if box with name already exists
            const existingBox = await BirdBoxes.findOne({
                attributes: ['birdbox_id'],
                where: {
                    name: name,
                    birdbox_id: { [sequelize.Op.not]: id }
                }
            });
            if (existingBox) {
                return res.status(400).json({
                    success: false,
                    error: 'Box with this name already exists'
                });
            }

            await box.update({ name, latitide, longitude, field_notes });

            res.json({
                success: true,
                data: box
            });
        } catch (error) {
            console.error('Error in updateBox:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to update box'
            });
        }
    }

    // Delete box
    static async deleteBox(req, res) {
        try {
            const { id } = req.params;

            const box = await BirdBoxes.findByPk(id);
            if (!box) {
                return res.status(404).json({
                    success: false,
                    error: 'Box not found'
                });
            }

            await box.destroy();

            res.json({
                success: true,
                message: 'Box deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteBox:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete box'
            });
        }
    }
}

module.exports = BoxController;
