const Birdguess = require('../models/Birdguess');

class BirdController {
    // Get all Birdguesses
    static async getAllGuess(req, res) {
        try {
            const guesses = await Birdguess.findAll({
                order: [['birdguess_id', 'record_id']]
            });
            res.json({
                success: true,
                count: guesses.length,
                data: guesses
            });
        } catch (error) {
            console.error('Error in getAllGuess:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch guesses'
            });
        }
    }

    // Get single Birdguess
    static async getGuess(req, res) {
        try {
            const { id } = req.params;
            const guess = await Birdguess.findByPk(id);

            if (!guess) {
                return res.status(404).json({
                    success: false,
                    error: 'Guess not found'
                });
            }

            res.json({
                success: true,
                data: guess
            });
        } catch (error) {
            console.error('Error in getGuess:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch guess'
            });
        }
    }

    // TODO create/run Python
    // Create new Birdguess
    static async createGuess(req, res) {
        try {
            const { record_id, species_id, model, model_confidence } = req.body;

            // Validation
            if (!record_id || !species_id || !model || !model_confidence) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide valid data'
                });
            }

            // Check if guess already exists
            const existingGuess = await Birdguess.findOne({
                attributes: ['record_id'],
                where: { record_id: record_id }
            });
            if (existingGuess) {
                return res.status(400).json({
                    success: false,
                    error: 'Record already exists'
                });
            }

            // Python stuff here?

            const newGuess = await Birdguess.create({ record_id, species_id, model, model_confidence });

            res.status(201).json({
                success: true,
                data: newGuess
            });
        } catch (error) {
            console.error('Error in createGuess:', error);
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create Bird guess record'
            });
        }
    }
}

module.exports = BirdController;
