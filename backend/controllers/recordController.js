const Birdrecords = require('../models/Birdrecords');
const Image = require('../models/Image');
const Birdboxes = require('../models/Birdboxes');
const Birdguess = require('../models/Birdguess');
const SpeciesDictionary = require('../models/SpeciesDictionary');
const sequelize = require('../config/database');

class RecordController {
    // Get all Birdrecords
    static async getAllRecords(req, res) {
        try {
            const records = await Birdrecords.findAll({
                include: [
                    { model: Image, as: 'image',
                        attributes: ['image_id', 'timestamp', 'file_size']
                    },
                    { model: Birdboxes, as: 'birdbox' },
                    { 
                        model: Birdguess, 
                        as: 'guesses',
                        include: [{ model: SpeciesDictionary, as: 'species' }]
                    }
                ],
                order: [['timestamp', 'DESC']]
            });

            records.map(record => {
                if (record.image) {
                    record.image.image_url = `/images/${record.image.image_id}`;
                }
            });

            res.json({
                success: true,
                count: records.length,
                data: records
            });
        } catch (error) {
            console.error('Error in getAllRecords:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch records'
            });
        }
    }

    // Get single Birdrecord
    static async getRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await Birdrecords.findByPk(id);

            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'Record not found'
                });
            }

            record.image.image_url = `/images/${record.image_id}`;

            res.json({
                success: true,
                data: record
            });
        } catch (error) {
            console.error('Error in getRecord:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch record'
            });
        }
    }

    // Create new Birdrecord
    static async createRecord(req, res) {
        try {
            const { birdbox_id, timestamp, image_id } = req.body;

            // Validation
            if (!birdbox_id || !timestamp || !image_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide valid data'
                });
            }

            // Check if record already exists
            const existingRecord = await Birdrecords.findOne({
                attributes: ['record_id'],
                where: {
                    birdbox_id: birdbox_id,
                    timestamp: timestamp
                }
            });
            if (existingRecord) {
                return res.status(400).json({
                    success: false,
                    error: 'Record already exists'
                });
            }

            const newRecord = await Birdrecords.create({ birdbox_id, timestamp, image_id });

            res.status(201).json({
                success: true,
                data: newRecord
            });
        } catch (error) {
            console.error('Error in createRecord:', error);
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create Bird record'
            });
        }
    }

    // Update record
    static async updateRecord(req, res) {
        try {
            const { id } = req.params;
            const { manual_bird } = req.body;

            const record = await Birdrecords.findByPk(id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'Record not found'
                });
            }

            await Birdrecords.update({ manual_bird: manual_bird });

            res.json({
                success: true,
                data: record
            });
        } catch (error) {
            console.error('Error in updateRecord:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to update record'
            });
        }
    }
}

module.exports = RecordController;
