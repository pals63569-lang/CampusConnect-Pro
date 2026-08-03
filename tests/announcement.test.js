const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');

describe('Announcements & Global Search Endpoints', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (server && server.close) {
      server.close();
    }
  });

  it('should fetch empty or seeded announcements list via GET /api/v1/announcements', async () => {
    const res = await request(app).get('/api/v1/announcements');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('announcements');
  });

  it('should return global search structure for GET /api/v1/search?q=test', async () => {
    const res = await request(app).get('/api/v1/search?q=test');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('events');
    expect(res.body.data).toHaveProperty('notices');
  });
});
