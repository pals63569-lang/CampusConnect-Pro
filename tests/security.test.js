const request = require('supertest');
const app = require('../src/app');

describe('Security & Enterprise Header Tests', () => {
  it('should include Helmet security headers on HTTP responses', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('strict-transport-security');
  });

  it('should reject malformed JSON body gracefully without crashing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('invalid json {');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should enforce rate limiting headers on API routes', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers).toHaveProperty('x-ratelimit-limit');
    expect(res.headers).toHaveProperty('x-ratelimit-remaining');
  });
});
