const Image = require('../models/Image');
const Birdrecords = require('../models/Birdrecords');
const Birdboxes = require('../models/Birdboxes');
const Jobs = require('../models/Job');
const sequelize = require('../config/database');
const { classifyImages } = require('./utils');

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
                image_url: `images/${image.image_id}` // URL to fetch image
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
        console.log('=== createImage function started ===');
        let transaction = null;
        try {
            console.log('Request body:', req.body);
            console.log('Request files:', req.files ? `${req.files.length} file(s)` : 'No files');
            
            const files = req.files; // Assuming you're using multer for file uploads
            if (!files || files.length === 0) {
                console.log('ERROR: No files uploaded');
                return res.status(400).json({
                    success: false,
                    error: 'No files uploaded'
                });
            }

            const { boxName, imageUrl } = req.body;
            console.log('Box name from request:', boxName);
            console.log('Image URL from request:', imageUrl);

            let imagesCreated = 0;
            const fileNameMap = {};

            for(const file of files) {
                console.log(`\n--- Processing file ${imagesCreated + 1}/${files.length} ---`);
                const {buffer, size, originalname, mimetype} = file;
                console.log('File details:', {
                    originalname,
                    mimetype,
                    size: `${size} bytes`,
                    hasBuffer: !!buffer
                });
                
                if(!buffer || !size || (mimetype !== 'image/jpeg' && mimetype !== 'image/png')) {
                    console.log('ERROR: Invalid file data');
                    throw new Error('Invalid file data from ' + originalname);
                }
                
                // Parse originalname for Date time string format
                let date1 = originalname.replace(/[^0-9_-]/g, '').slice(2).replace('_', 'T');
                const time1 = date1.slice(10).replace(/-/g, ':') + '.000Z';
                date1 = date1.slice(0, 10);
                const timestamp = new Date(date1 + time1);
                console.log('Timestamp:', timestamp.toISOString());

                console.log('Starting database transaction...');
                transaction = await sequelize.transaction();
                console.log('Transaction started successfully');
                
                console.log('Creating Image record...');
                const imgRes = await Image.create({
                    image: buffer,
                    timestamp,
                    file_size: size
                }, { transaction });
                console.log('Image created with ID:', imgRes.image_id);

                if(!imgRes || !imgRes.image_id) {
                    console.log('ERROR: Failed to create image record');
                    throw new Error('Failed to create image record for ' + originalname);
                }

                console.log('Looking up Birdbox with name:', boxName);
                const birdbox = await Birdboxes.findOne({ where: { name: boxName }, transaction });
                
                if(!birdbox) {
                    console.log('ERROR: Birdbox not found');
                    throw new Error('Birdbox not found: ' + boxName);
                }
                console.log('Birdbox found with ID:', birdbox.birdbox_id);

                console.log('Creating Birdrecord...');
                const recordRes = await Birdrecords.create({ 
                    birdbox_id: birdbox.birdbox_id, 
                    timestamp, 
                    image_id: imgRes.image_id,
                    manual_bird: null
                }, { transaction });
                console.log('Birdrecord created with ID:', recordRes.record_id);

                console.log('Creating job...');
                const jobRes = await Jobs.create({
                    event_type: 'birdrecord.created',
                    record_id: recordRes.record_id,
                    processed: false
                }, { transaction });
                console.log('Job created with ID:', jobRes.id);

                if(!recordRes || !recordRes.record_id) {
                    console.log('ERROR: Failed to create bird record');
                    throw new Error('Failed to create bird record for ' + originalname);
                }

                console.log('Committing transaction...');
                await transaction.commit();
                console.log('Transaction committed successfully');
                imagesCreated++;
                fileNameMap[originalname] = recordRes.record_id ?? -1;
                console.log(`File ${imagesCreated} processed successfully`);
            }

            console.log(`\n=== SUCCESS: ${imagesCreated} image(s) created ===\n`);
            console.log(`=== SENDING IMAGES TO CLASSIFICATION MODEL ===`);

            const results = await classifyImages(boxName, files, fileNameMap);
            console.log('Classification results:', results);
            console.log(`=== Finished processing all files ===`);

            res.status(201).json({
                success: true,
                imagesCreated,
                classificationResults: results
            });
        } catch (error) {
            console.error('\n=== ERROR in createImage ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            
            if(transaction) {
                console.log('Rolling back transaction...');
                await transaction.rollback();
                console.log('Transaction rolled back');
            }
            
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                console.log('Sequelize validation error:', error.errors.map(e => e.message));
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
