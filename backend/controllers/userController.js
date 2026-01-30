const User = require('../models/User');

class UserController {
    // Get all users
    static async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                order: [['created_at', 'DESC']]
            });
            res.json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
    }

    // Get single user
    static async getUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error in getUser:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user'
            });
        }
    }

    // Create new user
    static async createUser(req, res) {
        try {
            const { username, email, password } = req.body;
            
            // Validation
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide username, email, and password'
                });
            }
            
            // Check if user already exists
            const existingUser = await User.scope('withPassword').findOne({ 
                where: { email } 
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'User with this email already exists'
                });
            }
            
            const newUser = await User.create({ username, email, password });
            
            res.status(201).json({
                success: true,
                data: newUser
            });
        } catch (error) {
            console.error('Error in createUser:', error);
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create user'
            });
        }
    }

    // Update user
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, email } = req.body;
            
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            await user.update({ username, email });
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error in updateUser:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', ')
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to update user'
            });
        }
    }

    // Delete user
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            await user.destroy();
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteUser:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete user'
            });
        }
    }
}

module.exports = UserController;
