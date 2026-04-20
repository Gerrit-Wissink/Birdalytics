const Birdrecords = require('../models/Birdrecords');
const Image = require('../models/Image');
const Birdboxes = require('../models/Birdboxes');
const Birdguess = require('../models/Birdguess');
const SpeciesDictionary = require('../models/SpeciesDictionary');
const converter = require('json-2-csv');
const { formatManualBird } = require('./utils');
const { Op } = require('sequelize');

class RecordController {
    // Get all Birdrecords
    static async getAllRecords(req, res) {
        try {
            const records = await Birdrecords.findAll({
                include: [
                    {
                        model: Image, as: 'image',
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

    // Get all Birdrecords as CSV file
    static async getCsvRecords(req, res) {
        try {
            const records = await Birdrecords.findAll({
                include: [
                    {
                        model: Birdboxes,
                        as: 'birdbox',
                        attributes: ['name']
                    },
                    {
                        model: Birdguess,
                        as: 'guesses',
                        attributes: ['model', 'model_confidence'],
                        include: [
                            {
                                model: SpeciesDictionary, as: 'species',
                                attributes: ['species_name']
                            }
                        ]
                    }
                ],
                order: [['timestamp', 'DESC']]
            });

            const rows = records.map(record => {
                const csv = record.get({ plain: true });
                const guess = csv.guesses && csv.guesses.length ? csv.guesses[0] : null;

                return {
                    DateTime: new Date(csv.timestamp).toISOString(),
                    BirdboxName: csv.birdbox ? csv.birdbox.name : '',
                    ManualBird: csv.manual_bird ?? '',
                    GuessSpecies: guess && guess.species ? guess.species.species_name : '',
                    GuessModel: guess ? guess.model : '',
                    GuessConfidence: guess ? Number(guess.model_confidence).toFixed(3) : ''
                };
            });

            const output = await converter.json2csv(rows);

            res.header('Content-Type', 'text/csv');
            res.attachment('birdrecords.csv');
            return res.send(output);
        } catch (error) {
            console.error('Error in getCsvRecords:', error);
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

    static async setManualBird(req, res) {
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

            const formatted_bird = formatManualBird(manual_bird);

            const species = await SpeciesDictionary.findOne({ 
                where: { species_name: { [Op.iLike]: formatted_bird } }
            });

            if (!species) {
                const newSpecies = await SpeciesDictionary.create({ species_name: formatted_bird });
                console.log('Created new species:', newSpecies.species_name, 'with ID:', newSpecies.species_id);
            }

            await Birdrecords.update({ manual_bird: formatted_bird }, { where: { record_id: id } });

            res.json({
                success: true,
                data: record
            });
        } catch (error) {
            console.error('Error in setManualBird:', error);
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
