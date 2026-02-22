const sequelize = require('../config/database');
const { Birdguess } = require('../models');
const BirdBoxes = require('../models/Birdboxes');
const Birdrecords = require('../models/Birdrecords');
const Image = require('../models/Image');
const SpeciesDictionary = require('../models/SpeciesDictionary');

class BoxController {
    // Get all boxes
    static async getAllBoxes(req, res) {
        try {
            const boxes = await BirdBoxes.findAll({
                include: [
                    {
                        model: Birdrecords,
                        as: 'records',
                        include: [
                            {
                                model: Image,
                                as: 'image',
                                attributes: ['image_id', 'image']
                            },
                            {
                                model: Birdguess,
                                as: 'guesses',
                                include: [
                                    {
                                        model: SpeciesDictionary,
                                        as: 'species',
                                        attributes: ['species_id', 'species_name']
                                    }
                                ],
                                attributes: ['birdguess_id', 'model', 'model_confidence'],
                                limit: 1,
                                order: [['model_confidence', 'DESC']]
                            }
                        ],
                        attributes: ['record_id', 'timestamp', 'manual_bird'],
                        order: [['timestamp', 'DESC']]
                    }
                ],
                order: [['name', 'ASC'], ['created_at', 'DESC']]
            });

            /* 
                Boxes: 
                [
                    {
                        "birdbox_id": 1,
                        "name": "Box 1",
                        "latitide": 40.7128,
                        "longitude": -74.0060,
                        "field_notes": "Near the park",
                        "created_at": "2024-01-01T00:00:00.000Z",
                        "updated_at": "2024-01-01T00:00:00.000Z",
                        "records": [
                            {
                                "record_id": 1,
                                "timestamp": "2024-01-01T12:00:00.000Z",
                                "manual_bird": null,
                                "image": {
                                    "image_id": 1,
                                    "image": "<base64string>"
                                },
                                "guesses": [
                                    {
                                        "birdguess_id": 1,
                                        "model": "Model A",
                                        "model_confidence": 0.95,
                                        "species": {
                                            "species_id": 1,
                                            "species_name": "Kestrel"
                                        }
                                    },
                                    ...
                                ]
                            },
                            ...
                        ]
                    },
                    ...
                ]     
            */

            const stats = boxes.map(box => this.calculateBoxStats(box));

            res.json({
                success: true,
                count: boxes.length,
                data: boxes,
                stats: stats
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

    static calculateBoxStats(box) {
        /* 
            - Total number of captured photos
            - Total number of photos with creatures
            - Total number of kestrel-identified photos
            - Total number of non-kestrel identified photos
            - Number Active Days (days with more than X photos with an animal captured)
            - Usage Rate: Number active days / 25 days (or days available in record)
            - Total number of modified identification results
                - Of all the flagged identifications (photos with uncertain identifications needing review), how many of them have been modified
                - Can be a number: #modified flagged imgs/total flagged imgs
        */
        const totalRecords = box.records.length;
        const photosWithCreatures = box.records.filter(
            record => record.guesses && record.guesses.length > 0).length;
        const kestrelIdentified = box.records.filter(
            record => record.guesses && record.guesses.some(guess => guess.species && guess.species.species_id === 1)).length;
        const nonKestrelIdentified = photosWithCreatures - kestrelIdentified;


        const ACTIVE_DAY_THRESHOLD = 10; // Example threshold for active day
        const ACTIVE_DAY_PERIOD = 90; // Number of days to consider for active day calculation (e.g., last 90 days)

        const recordDays = {};
        box.records.forEach(record => {
            let recordDate = new Date(record.timestamp);
            let dateString = recordDate.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
            if (!recordDays[dateString]) {
                recordDays[dateString] = 0;
            }
            if (record.guesses && record.guesses.length > 0) {
                recordDays[dateString]++;
            }
            if (Object.keys(recordDays).length > ACTIVE_DAY_PERIOD) {
                return;
            }
        });
        
        const numActiveDays = Object.keys(recordDays).filter(date => recordDays[date] >= ACTIVE_DAY_THRESHOLD).length;
        const usageRate = numActiveDays / Math.min(ACTIVE_DAY_PERIOD, Object.keys(recordDays).length);
        
        const modifiedRecords = box.records.reduce((count, record) => {
            if (record.manual_bird !== null) {
                return count + 1;
            }
            return count;
        }, 0);

        return {
            totalRecords,
            photosWithCreatures,
            kestrelIdentified,
            nonKestrelIdentified,
            activeDays: numActiveDays,
            usageRate,
            modifiedRecords
        };
    }
}

module.exports = BoxController;
