const calculateBoxStats = (box) => {
    const totalRecords = box.records.length;
    const photosWithCreatures = box.records.filter(
        record => record.guesses && record.guesses.length > 0).length;
    const numKestrelIdentified = box.records.filter(
        record => record.guesses && record.guesses.some(guess => guess.species && guess.species.species_id === 1)).length;
    const nonKestrelIdentified = photosWithCreatures - numKestrelIdentified;
    const mostRecentKestrel = box.records.find(record => record.guesses && record.guesses.some(guess => guess.species && guess.species.species_id === 1));

    const ACTIVE_DAY_THRESHOLD = 10;
    const ACTIVE_DAY_PERIOD = 90;

    const recordDays = {};
    box.records.forEach(record => {
        let recordDate = new Date(record.timestamp);
        let dateString = recordDate.toISOString().split('T')[0];
        if (!recordDays[dateString]) {
            recordDays[dateString] = 0;
        }
        if (record.guesses && record.guesses.length > 0) {
            recordDays[dateString]++;
        }
        if (Object.keys(recordDays).length > ACTIVE_DAY_PERIOD) {
            return;
        }
    });
    
    const numActiveDays = Object.keys(recordDays).filter(date => recordDays[date] >= ACTIVE_DAY_THRESHOLD).length;
    const usageRate = numActiveDays / Math.min(ACTIVE_DAY_PERIOD, Object.keys(recordDays).length);

    const modifiedRecords = box.records.reduce((count, record) => {
        if (record.manual_bird !== null) {
            return count + 1;
        }
        return count;
    }, 0);

    return {
        birdbox_id: box.birdbox_id,
        totalRecords,
        photosWithCreatures,
        numKestrelIdentified,
        nonKestrelIdentified,
        numActiveDays,
        usageRate,
        modifiedRecords,
        mostRecentKestrel
    };
};

module.exports = { calculateBoxStats };