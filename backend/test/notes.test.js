const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');

describe('Notes Management API Endpoints', () => {
  let token;
  let createdNoteId;
  const userEmail = `notes_tester_${Date.now()}@example.com`;

  // Create and authenticate user before running note tests
  before(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Notes Tester',
        email: userEmail,
        password: 'Password123!'
      });
    token = res.body.token;
  });

  describe('POST /api/notes', () => {
    it('should create a new note with rich content and category', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My First Rich Note',
          content: '<h1>Meeting Notes</h1><p>Discuss project architecture.</p>',
          category: 'Work',
          isPinned: true
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('title', 'My First Rich Note');
      expect(res.body.note).to.have.property('is_pinned', 1);
      createdNoteId = res.body.note.id;
    });

    it('should fail to create note without a title', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'No title provided'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('GET /api/notes', () => {
    it('should return list of notes for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.notes).to.be.an('array');
      expect(res.body.notes.length).to.be.greaterThan(0);
    });

    it('should filter notes by search query', async () => {
      const res = await request(app)
        .get('/api/notes?search=Meeting')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.be.an('array');
      expect(res.body.notes.length).to.be.greaterThan(0);
      expect(res.body.notes[0].content).to.include('Meeting');
    });

    it('should filter notes by category', async () => {
      const res = await request(app)
        .get('/api/notes?category=Work')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.be.an('array');
      expect(res.body.notes[0]).to.have.property('category', 'Work');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should retrieve a single note by id', async () => {
      const res = await request(app)
        .get(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.note).to.have.property('id', createdNoteId);
      expect(res.body.note).to.have.property('title', 'My First Rich Note');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note title, content, and category', async () => {
      const res = await request(app)
        .put(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Note Title',
          content: '<p>Updated content here</p>',
          category: 'Personal',
          isPinned: false
        });

      expect(res.status).to.equal(200);
      expect(res.body.note).to.have.property('title', 'Updated Note Title');
      expect(res.body.note).to.have.property('category', 'Personal');
      expect(res.body.note).to.have.property('is_pinned', 0);
    });
  });

  describe('GET /api/notes/export/all', () => {
    it('should export all user notes as JSON', async () => {
      const res = await request(app)
        .get('/api/notes/export/all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.notes).to.be.an('array');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete the note successfully', async () => {
      const res = await request(app)
        .delete(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(checkRes.status).to.equal(404);
    });
  });
});
