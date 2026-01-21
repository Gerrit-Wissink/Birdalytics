const Example = require('../models/Example');

class ExampleController {
    // Get all examples
    static async getAllExamples(req, res) {
        try {
            const examples = await Example.findAll({
                order: [['created_at', 'DESC']]
            });
            res.json({
                success: true,
                count: examples.length,
                data: examples
            });
        } catch (error) {
            console.error('Error in getAllExamples:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch examples'
            });
        }
    }

    // Get single example
    static async getExample(req, res) {
        try {
            const { id } = req.params;
            const example = await Example.findByPk(id);
            
            if (!example) {
                return res.status(404).json({
                    success: false,
                    error: 'Example not found'
                });
            }
            
            res.json({
                success: true,
                data: example
            });
        } catch (error) {
            console.error('Error in getExample:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch example'
            });
        }
    }

    // Create new example
    static async createExample(req, res) {
        try {
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a name'
                });
            }
            
            const newExample = await Example.create({ name, description });
            
            res.status(201).json({
                success: true,
                data: newExample
            });
        } catch (error) {
            console.error('Error in createExample:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create example'
            });
        }
    }

    // Update example
    static async updateExample(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            
            const example = await Example.findByPk(id);
            if (!example) {
                return res.status(404).json({
                    success: false,
                    error: 'Example not found'
                });
            }
            
            await example.update({ name, description });
            
            res.json({
                success: true,
                data: example
            });
        } catch (error) {
            console.error('Error in updateExample:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to update example'
            });
        }
    }

    // Delete example
    static async deleteExample(req, res) {
        try {
            const { id } = req.params;
            
            const example = await Example.findByPk(id);
            if (!example) {
                return res.status(404).json({
                    success: false,
                    error: 'Example not found'
                });
            }
            
            await example.destroy();
            
            res.json({
                success: true,
                message: 'Example deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteExample:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete example'
            });
        }
    }
}

module.exports = ExampleController;
