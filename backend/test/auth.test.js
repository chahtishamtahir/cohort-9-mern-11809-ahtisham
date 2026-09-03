const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Authentication API (MERN with JavaScript)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/auth/signup', () => {
    it('should validate missing required fields and return 400', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('required');
    });

    it('should return 400 if user with email already exists', async () => {
      sinon.stub(User, 'findOne').resolves({ email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'Password123!'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('already exists');
    });

    it('should successfully register a user and return JWT token', async () => {
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').resolves({
        _id: '507f1f77bcf86cd799439011',
        name: 'New User',
        email: 'newuser@example.com'
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', 'newuser@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });

    it('should return 401 if user does not exist', async () => {
      sinon.stub(User, 'findOne').resolves(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123!'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Invalid email or password');
    });

    it('should return 401 if password does not match', async () => {
      sinon.stub(User, 'findOne').resolves({
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        password: '$2a$10$fakeHashedPassword'
      });
      sinon.stub(bcrypt, 'compare').resolves(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should log in successfully with correct credentials', async () => {
      sinon.stub(User, 'findOne').resolves({
        _id: '507f1f77bcf86cd799439011',
        name: 'Valid User',
        email: 'valid@example.com',
        password: '$2a$10$fakeHashedPassword',
        created_at: new Date()
      });
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'CorrectPassword123!'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', 'valid@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if no Authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should return user profile when valid token is provided', async () => {
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', email: 'me@example.com' },
        process.env.JWT_SECRET || 'super_secret_jwt_key_notes_app_2026'
      );

      sinon.stub(User, 'findById').returns({
        select: sinon.stub().resolves({
          _id: '507f1f77bcf86cd799439011',
          name: 'Me User',
          email: 'me@example.com'
        })
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.user).to.have.property('email', 'me@example.com');
    });
  });
});
