const FormData = require('form-data');
const axios = require('axios');


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

const classifyImages = (boxName, files) => {
    if(!files || files.length === 0) {
        console.log('No files provided for classification');
        return;
    }

    try {
        const formData = new FormData();


        formData.append('boxName', boxName);
        for (const file of files) {
            formData.append('files', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype
            });
        }

        const response = await axios.post('http://localhost:6000/predict', formData, {
            headers: formData.getHeaders()
        });

        if (response.status === 200) {
            console.log('Classification response:', response.data);
            const data = response.data;

            if(data.boxName !== boxName) {
                console.error(`Box name mismatch in response. Expected: ${boxName}, Received: ${data.boxName}`);
                return;
            }

            if(!data.results || !Array.isArray(data.results)) {
                console.error('Invalid results format in classification response:', data.results);
                return;
            }

            return data;
        } else if(response.status === 400) {
            console.error('Bad request to classification model:', response.data);
        } else if(response.status === 500) {
            console.error('Server error from classification model:', response.data);
        } else if (response.status === 404) {
            console.error('Classification endpoint not found:', response.data);
        } else {
            console.error('Unexpected response from classification model:', response.status, response.data);
        }
    }catch (error) {
        console.error('Error classifying images:', error);
    }
}

module.exports = { calculateBoxStats, classifyImages };