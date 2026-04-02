const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    event_type: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    file_name: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'image.jpg'
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'outbox_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Job;
