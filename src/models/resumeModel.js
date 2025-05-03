// src/models/resumeModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resume = sequelize.define('Resume', {
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
userId: {
type: DataTypes.UUID,
allowNull: false,
},
data: {
type: DataTypes.JSONB,
allowNull: false,
defaultValue: {},
},
status: {
type: DataTypes.ENUM('draft','final'),
defaultValue: 'draft',
},
}, { timestamps: true });

module.exports = Resume;