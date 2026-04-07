const sequelize = require('../config/database');
const { Birdguess, Birdboxes, Birdrecords, Image, SpeciesDictionary } = require('../models');
const { calculateBoxStats } = require('./utils');

class BoxController {
    // Get all boxes
    static async getAllBoxesInfo(req, res) {
        try {
            const boxes = await Birdboxes.findAll({
                include: [
                    {
                        model: Birdrecords,
                        as: 'records',
                        include: [
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
                                attributes: ['birdguess_id', 'model', 'model_confidence', 'species_id'],
                            }
                        ],
                        attributes: ['record_id', 'timestamp', 'manual_bird', 'image_id', 'updated_at']
                    }
                ],
                order: [
                    ['name', 'ASC'],
                    ['created_at', 'DESC'],
                    [{ model: Birdrecords, as: 'records' }, 'record_id', 'DESC'],
                    [{ model: Birdrecords, as: 'records' }, { model: Birdguess, as: 'guesses' }, 'model_confidence', 'DESC']
                ]
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
            if (!boxes || boxes.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No boxes found'
                });
            }

            const stats = boxes.map(box => calculateBoxStats(box));

            const formattedData = []

            for (const [index, box] of boxes.entries()) {
                const latestRecord = box.records?.[0];
                formattedData.push(
                    {
                        birdbox_id: box.birdbox_id,
                        birdbox_name: box.name,
                        birdbox_lat: box.latitude,
                        birdbox_long: box.longitude,
                        location: box.location_name ?? box.name,
                        installation_date: box.created_at,
                        last_captured_image: latestRecord
                            ? {
                                photo_url: `images/${latestRecord.image_id}`,
                                timestamp: latestRecord.timestamp
                            }
                            : null,
                        last_identified_kestrel: stats[index]?.mostRecentKestrel ?? null,
                        total_captured_photos: stats[index]?.totalRecords ?? 0,
                        total_photos_with_creatures: stats[index]?.photosWithCreatures ?? 0,
                        total_kestrel_identified_photos: stats[index]?.numKestrelIdentified ?? 0,
                        total_non_kestrel_identified_photos: stats[index]?.nonKestrelIdentified ?? 0,
                        total_non_bird_photos: stats[index]?.nonBirds ?? 0,
                        number_active_days: stats[index]?.numActiveDays ?? 0,
                        usage_rate: stats[index]?.usageRate ?? 0,
                        kestrel_frequency: stats[index]?.kestrelFrequency ?? 0,
                        modified_records: stats[index]?.modifiedRecords ?? 0,
                        records: [
                            ...box.records.map(record => ({
                                record_id: record.record_id,
                                timestamp: record.timestamp,
                                modified_bird: record.manual_bird,
                                modified_date: record.updated_at,
                                image_url: `images/${record.image_id}`,
                                primary_guess: record.guesses && record.guesses.length > 0 ? record.guesses[0].species.species_name : null,
                                primary_guess_confidence: record.guesses && record.guesses.length > 0 ? record.guesses[0].model_confidence : null,
                                other_guesses: record.guesses && record.guesses.length > 1 ? record.guesses.slice(1).map(guess => ({
                                    species_id: guess.species ? guess.species.species_id : null,
                                    species_name: guess.species ? guess.species.species_name : null,
                                    model_confidence: guess.model_confidence
                                })) : []
                            }))
                        ]
                    }
                );
            }

            res.json({
                success: true,
                data: formattedData
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
            const box = await Birdboxes.findByPk(id);

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

    static async getBoxInfo(req, res) {
        try {
            const { id } = req.params;
            const box = await Birdboxes.findByPk(id, {
                include: [
                    {
                        model: Birdrecords,
                        as: 'records',
                        include: [
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
                                attributes: ['birdguess_id', 'model', 'model_confidence', 'species_id'],
                            }
                        ],
                        attributes: ['record_id', 'timestamp', 'manual_bird', 'image_id', 'updated_at']
                    }
                ],
                order: [
                    [{ model: Birdrecords, as: 'records' }, 'record_id', 'DESC'],
                    [{ model: Birdrecords, as: 'records' }, { model: Birdguess, as: 'guesses' }, 'model_confidence', 'DESC']
                ]
            });

            if (!box) {
                return res.status(404).json({
                    success: false,
                    error: 'Box not found'
                });
            }

            const stats = calculateBoxStats(box);

            const latestRecord = box.records?.[0];

            const formattedData = {
                birdbox_id: box.birdbox_id,
                birdbox_name: box.name,
                birdbox_lat: box.latitude,
                birdbox_long: box.longitude,
                location: box.location_name ?? box.name,
                installation_date: box.created_at,
                last_captured_image: latestRecord
                    ? {
                        photo_url: `images/${latestRecord.image_id}`,
                        timestamp: latestRecord.timestamp
                    }
                    : null,
                last_identified_kestrel: stats?.mostRecentKestrel ?? null,
                total_captured_photos: stats?.totalRecords ?? 0,
                total_photos_with_creatures: stats?.photosWithCreatures ?? 0,
                total_kestrel_identified_photos: stats?.numKestrelIdentified ?? 0,
                total_non_kestrel_identified_photos: stats?.nonKestrelIdentified ?? 0,
                number_active_days: stats?.numActiveDays ?? 0,
                usage_rate: stats?.usageRate ?? 0,
                modified_records: stats?.modifiedRecords ?? 0,
                records: [
                    ...box.records.map(record => ({
                        record_id: record.record_id,
                        timestamp: record.timestamp,
                        modified_bird: record.manual_bird,
                        modified_date: record.updated_at,
                        image_url: `images/${record.image_id}`,
                        primary_guess: record.guesses && record.guesses.length > 0 ? record.guesses[0].species.species_name : null,
                        primary_guess_confidence: record.guesses && record.guesses.length > 0 ? record.guesses[0].model_confidence : null,
                        other_guesses: record.guesses && record.guesses.length > 1 ? record.guesses.slice(1).map(guess => ({
                            species_id: guess.species ? guess.species.species_id : null,
                            species_name: guess.species ? guess.species.species_name : null,
                            model_confidence: guess.model_confidence
                        })) : []
                    }))
                ]
            };

            res.json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            console.error('Error in getBox:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch box'
            });
        }
    }

    static async getAllBoxes(req, res) {
        try {
            const boxes = await Birdboxes.findAll({
                order: [['name', 'ASC'], ['created_at', 'DESC']]
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

    // Create new box
    static async createBox(req, res) {
        try {
            const { name, location, latitude, longitude, field_notes } = req.body;

            // Validation
            if (!name || !location || !latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide name, location, and coordinates for the box'
                });
            }

            // Check if box already exists
            const existingBox = await Birdboxes.findOne({
                attributes: ['birdbox_id'],
                where: { name: name }
            });
            if (existingBox) {
                return res.status(400).json({
                    success: false,
                    error: 'Box with this name already exists'
                });
            }

            const newBox = await Birdboxes.create({ name, latitude, longitude, field_notes });

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
            const { name, latitude, longitude, field_notes } = req.body;

            const box = await Birdboxes.findByPk(id);
            if (!box) {
                return res.status(404).json({
                    success: false,
                    error: 'Box not found'
                });
            }

            // Check if box with name already exists
            const existingBox = await Birdboxes.findOne({
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

            await box.update({ name, latitude, longitude, field_notes });

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

            const box = await Birdboxes.findByPk(id);
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
