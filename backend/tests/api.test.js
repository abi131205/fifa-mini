/**
 * @fileoverview Integration tests for the Express endpoints.
 */
import request from 'supertest';
import app from '../app.js';

describe('Express API Route Handlers & Validator Rules', () => {
  
  test('9. GET /api/crowd/status should return current gates metrics', async () => {
    const res = await request(app)
      .get('/api/crowd/status')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.gates).toBeDefined();
    expect(res.body.gates.length).toBe(8);
  });

  test('10. POST /api/crowd/phase should validate and block invalid phase changes', async () => {
    const res = await request(app)
      .post('/api/crowd/phase')
      .send({ phase: 'SUPER_RUSH_SPECTACLE' }) // Invalid phase name
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('11. POST /api/chat should block messages exceeding length limit (500 chars)', async () => {
    const longMessage = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/chat')
      .send({ message: longMessage })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].msg).toContain('500 characters');
  });

  test('12. POST /api/chat should block empty chat messages', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
