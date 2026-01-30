const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Birdrecord = sequelize.define('Birdrecord', {
    record_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    birdbox_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    manual_bird: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            notEmpty: true, //means it cannot be an empty string
            len: [1, 255]
        }
    }
}, {
    tableName: 'birdrecords',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Birdrecord;