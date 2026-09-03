const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const db = require('../src/config/db');

describe('Authentication API Endpoints', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test User';

  describe('POST /api/auth/signup', () => {
    it('should successfully register a new user and return a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: testName,
          email: testEmail,
          password: testPassword
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', testEmail);
      expect(res.body.user).to.have.property('name', testName);
    });

    it('should reject signup with an already registered email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: testName,
          email: testEmail,
          password: testPassword
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('already exists');
    });

    it('should reject signup if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'missing@example.com'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with correct credentials and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', testEmail);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrong_password_here'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile when valid token is supplied', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      const token = loginRes.body.token;

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).to.equal(200);
      expect(profileRes.body.user).to.have.property('email', testEmail);
    });

    it('should deny access if token is absent', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });
});
