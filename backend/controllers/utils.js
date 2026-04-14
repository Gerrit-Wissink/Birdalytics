const calculateBoxStats = (box) => {
    const totalRecords = box.records.length;
    const photosWithCreatures = box.records.filter(
        record => record.guesses && record.guesses.length > 0
    ).length;
    const numKestrelIdentified = box.records.filter(
        record =>
            record.guesses &&
            record.guesses.some(
                guess => guess.species && guess.species.species_id === 1
            )
    ).length;
    const nonKestrelIdentified = photosWithCreatures - numKestrelIdentified;
    const mostRecentKestrel = box.records.find(
        record =>
            record.guesses &&
            record.guesses.some(
                guess => guess.species && guess.species.species_id === 1
            )
    );

    const ACTIVE_DAY_THRESHOLD = 10;
    const ACTIVE_DAY_PERIOD = 90;

    const recordDays = {};
    box.records.forEach(record => {
        const recordDate = new Date(record.timestamp);
        const dateString = recordDate.toISOString().split('T')[0];

        if (!recordDays[dateString]) {
            recordDays[dateString] = 0;
        }

        if (record.guesses && record.guesses.length > 0) {
            recordDays[dateString]++;
        }
    });

    const recordDayKeys = Object.keys(recordDays);
    const numActiveDays = recordDayKeys.filter(
        date => recordDays[date] >= ACTIVE_DAY_THRESHOLD
    ).length;
    const totalDays = Math.min(ACTIVE_DAY_PERIOD, recordDayKeys.length);
    const usageRate = totalDays ? numActiveDays / totalDays : 0;

    const modifiedRecords = box.records.reduce((count, record) => {
        if (record.manual_bird !== null) {
            return count + 1;
        }
        return count;
    }, 0);

    const kestrelFrequency = numKestrelIdentified / (photosWithCreatures || 1);

    const nonBirds = box.records.filter(
        record => !record.guesses || record.guesses.length === 0
    ).length;

    return {
        birdbox_id: box.birdbox_id,
        totalRecords,
        photosWithCreatures,
        numKestrelIdentified,
        nonKestrelIdentified,
        numActiveDays,
        usageRate,
        modifiedRecords,
        nonBirds,
        mostRecentKestrel,
        kestrelFrequency
    };
};

const formatManualBird = (manualBird) => {
    if (manualBird === null) {
        return 'None';
    }
    // I want to trim whitespace, capitalize the first letter, and lowercase the rest
    const trimmed = manualBird.trim();
    if (trimmed.length === 0) {
        return 'None';
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

module.exports = { calculateBoxStats, formatManualBird };