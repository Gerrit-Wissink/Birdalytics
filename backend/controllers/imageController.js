const Image = require('../models/Image');
const Birdrecords = require('../models/Birdrecords');
const Birdboxes = require('../models/Birdboxes');
const sequelize = require('../config/database');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

class ImageController {
    // Get all images
    static async getAllImages(req, res) {
        try {
            const images = await Image.findAll({
                order: [['timestamp', 'DESC']]
            });
            const imageList = images.map(image => ({
                image_id: image.image_id,
                timestamp: image.timestamp,
                file_size: image.file_size,
                image_url: `/images/${image.image_id}` // URL to fetch image
            }));
            res.json({
                success: true,
                count: imageList.length,
                data: imageList
            });
        } catch (error) {
            console.error('Error in getAllImages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch images'
            });
        }
    }

    // Get single image
    static async getImage(req, res) {
        try {
            const { id } = req.params;
            const im = await Image.findByPk(id);

            if (!im) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }

            res.set('Content-Type', 'image/jpeg');
            res.send(im.image);
        } catch (error) {
            console.error('Error in getImage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch image'
            });
        }
    }

    static async getImageInfo(req, res) {
        try {
            const { id } = req.params;
            const image = await Image.findByPk(id);
            res.json({
                image_id: image.image_id,
                timestamp: image.timestamp,
                file_size: image.file_size,
                image_url: `/images/${image.image_id}` // URL to fetch image
            });
        } catch (error) {
            console.error('Error in getImageInfo:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch image info'
            });
        }
    }

    // Create new image
    static async createImage(req, res) {
        let transaction = null;
        try {
            const files = req.files; // Assuming you're using multer for file uploads
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files uploaded'
                });
            }

            const {boxName, imageUrl} = req.body;

            let imagesCreated = 0;

            for(const file of files) {
                const {buffer, size, originalname, mimetype} = file;
                if(!buffer || !size || (mimetype !== 'image/jpeg' && mimetype !== 'image/png')) {
                    throw new Error('Invalid file data from ' + originalname);
                }
                const timestamp = new Date();
                transaction = await sequelize.transaction();
                const imgRes = await Image.create({
                    image: buffer,
                    timestamp,
                    file_size: size
                }, { transaction });

                if(!imgRes || !imgRes.image_id) {
                    throw new Error('Failed to create image record for ' + originalname);
                }

                const birdbox = await Birdboxes.findOne({ where: { name: boxName }, transaction });
                
                if(!birdbox) {
                    throw new Error('Birdbox not found: ' + boxName);
                }

                const recordRes = await Birdrecords.create({ 
                    birdbox_id: birdbox.birdbox_id, 
                    timestamp, 
                    image_id: imgRes.image_id,
                    manual_bird: null
                }, { transaction });

                if(!recordRes || !recordRes.record_id) {
                    throw new Error('Failed to create bird record for ' + originalname);
                }

                await transaction.commit();
                imagesCreated++;
            }

            res.status(201).json({
                success: true,
                imagesCreated,
            });
        } catch (error) {
            console.error('Error in createImage:', error);
            if(transaction) {
                await transaction.rollback();
            }
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    error: error.errors.map(e => e.message).join(', '),
                    imagesCreated
                });
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create all images: ' + error.message,
                imagesCreated
            });
        }
    }

    // Delete image
    static async deleteImage(req, res) {
        try {
            const { id } = req.params;

            const image = await Image.findByPk(id);
            if (!image) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }

            await image.destroy();

            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteImage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete image'
            });
        }
    }
}

module.exports = ImageController;
