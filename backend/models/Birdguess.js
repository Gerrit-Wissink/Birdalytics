const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Birdguess = sequelize.define('Birdguess', {
    birdguess_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    species_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    model_confidence: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        validate: {
            min: 0.0,
            max: 1.0
        }
    }
}, {
    tableName: 'birdguesses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Birdguess;