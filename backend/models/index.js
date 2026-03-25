const User = require('./User');
const Birdrecords = require('./Birdrecords');
const Birdguess = require('./Birdguess');
const Image = require('./Image');
const SpeciesDictionary = require('./SpeciesDictionary');
const Birdboxes = require('./Birdboxes');
const Jobs = require('./Job');

// Birdbox relationships (Birdbox is referenced by Birdrecords)
Birdboxes.hasMany(Birdrecords, {
    foreignKey: 'birdbox_id',
    as: 'records'
});

Birdrecords.belongsTo(Birdboxes, {
    foreignKey: 'birdbox_id',
    as: 'birdbox'
});

// Image relationships (Image is referenced by Birdrecords)
Image.hasMany(Birdrecords, {
    foreignKey: 'image_id',
    as: 'records'
});

Birdrecords.belongsTo(Image, {
    foreignKey: 'image_id',
    as: 'image'
});

// Birdrecords and Birdguess relationships (One-to-Many)
Birdrecords.hasMany(Birdguess, {
    foreignKey: 'record_id',
    as: 'guesses'
});

Birdguess.belongsTo(Birdrecords, {
    foreignKey: 'record_id',
    as: 'record'
});

// SpeciesDictionary relationships (Species is referenced by Birdguess)
SpeciesDictionary.hasMany(Birdguess, {
    foreignKey: 'species_id',
    as: 'guesses'
});

Birdguess.belongsTo(SpeciesDictionary, {
    foreignKey: 'species_id',
    as: 'species'
});

Birdrecords.hasMany(Jobs, {
    foreignKey: "record_id",
    sourceKey: "record_id",
    as: "jobs"
});

Jobs.belongsTo(Birdrecords, {
    foreignKey: "record_id",
    targetKey: "record_id",
    as: "birdRecord"
});

module.exports = {
    User,
    Birdrecords,
    Birdguess,
    Image,
    SpeciesDictionary,
    Birdboxes,
    Jobs
};