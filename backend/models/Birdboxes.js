const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Birdbox = sequelize.define('Birdbox', {
    birdbox_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    latitide: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        validate: {
            isDecimal: true
        }
    },
    longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        validate: {
            isDecimal: true
        }
    },
    field_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'birdboxes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Birdbox;