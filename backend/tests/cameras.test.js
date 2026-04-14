const request = require('supertest');
const app = require('../app');

describe('GET /api', () => {
    test('returns API status', async () => {
        const res = await request(app).get('/api');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            message: 'Birdalytics API',
            version: '1.0.0',
            status: 'running'
        });
    });
});
