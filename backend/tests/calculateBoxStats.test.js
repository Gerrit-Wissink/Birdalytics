const { calculateBoxStats } = require('../controllers/utils');

describe('calculateBoxStats', () => {
    test('handles empty records safely', () => {
        const result = calculateBoxStats({ records: [] });

        expect(result.totalRecords).toBe(0);
        expect(result.photosWithCreatures).toBe(0);
        expect(result.numKestrelIdentified).toBe(0);
        expect(result.nonKestrelIdentified).toBe(0);
    });

    test('counts records with guesses', () => {
        const box = {
            records: [
                { timestamp: '2026-04-01T12:00:00Z', guesses: [] },
                { timestamp: '2026-04-02T12:00:00Z', guesses: [{ species: { species_id: 1 } }] },
                { timestamp: '2026-04-03T12:00:00Z', guesses: [{ species: { species_id: 2 } }] },
                { timestamp: '2026-04-04T12:00:00Z', guesses: null }
            ]
        };

        const result = calculateBoxStats(box);

        expect(result.totalRecords).toBe(4);
        expect(result.photosWithCreatures).toBe(2);
        expect(result.numKestrelIdentified).toBe(1);
        expect(result.nonKestrelIdentified).toBe(1);
    });

    test('does not crash when species is missing', () => {
        const box = {
            records: [
                { timestamp: '2026-04-01T12:00:00Z', guesses: [{ species: null }] },
                { timestamp: '2026-04-02T12:00:00Z', guesses: [{ notSpecies: true }] }
            ]
        };

        const result = calculateBoxStats(box);

        expect(result.totalRecords).toBe(2);
        expect(result.photosWithCreatures).toBe(2);
        expect(result.numKestrelIdentified).toBe(0);
        expect(result.nonKestrelIdentified).toBe(2);
    });
});
