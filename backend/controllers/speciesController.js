const SpeciesDictionary = require('../models/SpeciesDictionary');

class SpeciesController {
    // Get all species
    static async getAllSpecies(req, res) {
        try {
            const species = await SpeciesDictionary.findAll({
                order: [['species_name']]
            });
            res.json({
                success: true,
                count: species.length,
                data: species
            });
        } catch (error) {
            console.error('Error in getAllSpecies:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch species'
            });
        }
    }

    // Get single species
    static async getSpecies(req, res) {
        try {
            const { id } = req.params;
            const item = await SpeciesDictionary.findByPk(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    error: 'Species not found'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Error in getSpecies:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch species'
            });
        }
    }
}

module.exports = SpeciesController;
