const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Image = sequelize.define('Image', {
    image_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true
    },
    image: {
        type: DataTypes.BLOB('long'),
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
    }, {
    tableName: 'images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Image;
    