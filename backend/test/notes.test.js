const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const User = require('../src/models/User');
const Note = require('../src/models/Note');

describe('Notes Management API (MERN with JavaScript)', () => {
  const userId = '507f1f77bcf86cd799439011';
  const fakeToken = jwt.sign(
    { id: userId, email: 'tester@example.com' },
    process.env.JWT_SECRET || 'super_secret_jwt_key_notes_app_2026'
  );

  beforeEach(() => {
    // Stub User.findById for auth middleware
    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({
        _id: userId,
        id: userId,
        name: 'Tester User',
        email: 'tester@example.com'
      })
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/notes', () => {
    it('should reject note creation without title', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ content: 'Missing title' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('title is required');
    });

    it('should create note with title, content, category, and isPinned', async () => {
      sinon.stub(Note, 'create').resolves({
        _id: '607f1f77bcf86cd799439022',
        id: '607f1f77bcf86cd799439022',
        user: userId,
        title: 'MERN Note',
        content: '<h1>Rich Content</h1>',
        category: 'Work',
        is_pinned: true
      });

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          title: 'MERN Note',
          content: '<h1>Rich Content</h1>',
          category: 'Work',
          isPinned: true
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('title', 'MERN Note');
      expect(res.body.note).to.have.property('is_pinned', true);
    });
  });

  describe('GET /api/notes', () => {
    it('should fetch user notes with sorting', async () => {
      sinon.stub(Note, 'find').returns({
        sort: sinon.stub().resolves([
          { _id: '1', title: 'Note 1', category: 'Work', is_pinned: true },
          { _id: '2', title: 'Note 2', category: 'General', is_pinned: false }
        ])
      });

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.notes).to.be.an('array');
      expect(res.body.notes.length).to.equal(2);
    });

    it('should support search and category queries', async () => {
      sinon.stub(Note, 'find').returns({
        sort: sinon.stub().resolves([
          { _id: '1', title: 'Specific Title', category: 'Work' }
        ])
      });

      const res = await request(app)
        .get('/api/notes?search=Specific&category=Work')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.notes[0]).to.have.property('title', 'Specific Title');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note and return updated document', async () => {
      sinon.stub(Note, 'findOneAndUpdate').resolves({
        _id: '607f1f77bcf86cd799439022',
        title: 'Updated Title',
        category: 'Personal',
        is_pinned: false
      });

      const res = await request(app)
        .put('/api/notes/607f1f77bcf86cd799439022')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ title: 'Updated Title', category: 'Personal', isPinned: false });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('title', 'Updated Title');
    });

    it('should return 404 if note does not exist or does not belong to user', async () => {
      sinon.stub(Note, 'findOneAndUpdate').resolves(null);

      const res = await request(app)
        .put('/api/notes/nonexistent_id')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ title: 'Test' });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete note successfully', async () => {
      sinon.stub(Note, 'findOneAndDelete').resolves({
        _id: '607f1f77bcf86cd799439022',
        title: 'Deleted Note'
      });

      const res = await request(app)
        .delete('/api/notes/607f1f77bcf86cd799439022')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.message).to.include('deleted successfully');
    });
  });

  describe('GET /api/notes/export/all', () => {
    it('should export all notes for user', async () => {
      sinon.stub(Note, 'find').returns({
        select: sinon.stub().resolves([
          { title: 'Exported Note', content: 'Export Content' }
        ])
      });

      const res = await request(app)
        .get('/api/notes/export/all')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.notes).to.be.an('array');
    });
  });
});
