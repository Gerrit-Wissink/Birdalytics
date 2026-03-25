const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SpeciesDictionary = sequelize.define('SpeciesDictionary', {
    species_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    species_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true, //means it cannot be an empty string
            len: [1, 255]
        }
    },
    tag: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            len: [0, 255]
        }
    }
}, {
    tableName: 'species_dictionary',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['species_name']
        }
    ]
});

module.exports = SpeciesDictionary;