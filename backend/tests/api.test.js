/**
 * @fileoverview Integration tests for all Express endpoints and route validations.
 */
import request from 'supertest';
import app from '../app.js';

describe('Express API Route Handlers & Validator Rules', () => {
  
  test('1. GET /api/crowd/status should return current gates metrics', async () => {
    const res = await request(app)
      .get('/api/crowd/status')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.gates).toBeDefined();
    expect(res.body.gates.length).toBe(8);
  });

  test('2. POST /api/crowd/phase should validate and block invalid phase changes', async () => {
    const res = await request(app)
      .post('/api/crowd/phase')
      .send({ phase: 'SUPER_RUSH_SPECTACLE' }) // Invalid phase name
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('3. POST /api/crowd/phase should successfully update phase when input is valid', async () => {
    const res = await request(app)
      .post('/api/crowd/phase')
      .send({ phase: 'MID_MATCH_CALM' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.phase).toBe('MID_MATCH_CALM');
  });

  test('4. POST /api/crowd/staff should successfully update volunteer allocations with valid payload', async () => {
    const res = await request(app)
      .post('/api/crowd/staff')
      .send({
        allocation: {
          gate_1: 20,
          gate_3: 40
        }
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.allocation).toBeDefined();
    expect(res.body.allocation.gate_1).toBe(20);
    expect(res.body.allocation.gate_3).toBe(40);
  });

  test('5. POST /api/crowd/staff should reject invalid staff allocation payload', async () => {
    const res = await request(app)
      .post('/api/crowd/staff')
      .send({ allocation: 'not-an-object' }) // Invalid: must be an object
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('6. GET /api/alerts should successfully return active warning logs list', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.alerts).toBeDefined();
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  test('7. POST /api/chat should block messages exceeding length limit (500 chars)', async () => {
    const longMessage = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/chat')
      .send({ message: longMessage })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].msg).toContain('500 characters');
  });

  test('8. POST /api/chat should block empty chat messages', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('9. POST /api/chat should return a valid response text when input is normal', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is the density at Gate 3?' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.response).toBeDefined();
    expect(typeof res.body.response).toBe('string');
  });

});
