const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    // Login user
    static async loginUser(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide username and password'
                });
            }
            
            // Find user with password (using withPassword scope)
            const user = await User.scope('withPassword').findOne({ 
                where: { username } 
            });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
            
            // Compare password with hashed password in database
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
            
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not configured');
            }

            /* commenting out
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    username: user.username
                },
                process.env.JWT_SECRET || 'your secret key change this',
                { expiresIn: '24h' }
            );
            */

            // Create JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );

            // Calculate expiration date from the signed token payload
            const decodedToken = jwt.decode(token);
            const expiresAt = decodedToken?.exp
                ? new Date(decodedToken.exp * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            // Return token and expiration date (exclude password from response)
            res.json({
                success: true,
                token: token,
                expiresAt: expiresAt.toISOString(),
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            });
        } catch (error) {
            console.error('Error in loginUser:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }
}

module.exports = UserController;
