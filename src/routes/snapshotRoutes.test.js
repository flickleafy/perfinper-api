import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Note: This test file uses supertest for integration testing.
// If supertest is not available, these tests can be adapted to unit tests.

const snapshotService = {
  createFiscalBookSnapshot: jest.fn(),
  getSnapshotsForFiscalBook: jest.fn(),
  getSnapshotDetails: jest.fn(),
  getSnapshotTransactions: jest.fn(),
  deleteSnapshot: jest.fn(),
  compareSnapshotWithCurrent: jest.fn(),
  updateTags: jest.fn(),
  toggleProtection: jest.fn(),
  addAnnotation: jest.fn(),
  addTransactionAnnotation: jest.fn(),
  exportSnapshot: jest.fn(),
  cloneToNewFiscalBook: jest.fn(),
  rollbackToSnapshot: jest.fn(),
};

const snapshotSchedulerService = {
  getSchedule: jest.fn(),
  updateSchedule: jest.fn(),
};

jest.unstable_mockModule('../services/snapshotService.js', () => snapshotService);
jest.unstable_mockModule('../services/snapshotSchedulerService.js', () => snapshotSchedulerService);

const { default: snapshotRoutes } = await import('./snapshotRoutes.js');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', snapshotRoutes);
  return app;
};

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('snapshotRoutes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  // ===== POST /api/fiscal-book/:fiscalBookId/snapshots =====
  describe('POST /api/fiscal-book/:fiscalBookId/snapshots', () => {
    test('creates snapshot and returns 201', async () => {
      snapshotService.createFiscalBookSnapshot.mockResolvedValue({ _id: 'snap1' });

      const response = await request(app)
        .post('/api/fiscal-book/fb1/snapshots')
        .send({ name: 'Test Snapshot', tags: ['audit'] });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe('snap1');
      expect(snapshotService.createFiscalBookSnapshot).toHaveBeenCalledWith('fb1', {
        name: 'Test Snapshot',
        tags: ['audit'],
      });
    });

    test('returns 500 on error', async () => {
      snapshotService.createFiscalBookSnapshot.mockRejectedValue(new Error('Create failed'));

      const response = await request(app)
        .post('/api/fiscal-book/fb1/snapshots')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Create failed');
    });
  });

  // ===== GET /api/fiscal-book/:fiscalBookId/snapshots =====
  describe('GET /api/fiscal-book/:fiscalBookId/snapshots', () => {
    test('returns snapshots list', async () => {
      snapshotService.getSnapshotsForFiscalBook.mockResolvedValue({
        snapshots: [{ _id: 'snap1' }],
        total: 1,
        limit: 50,
        skip: 0,
      });

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    test('applies query filters', async () => {
      snapshotService.getSnapshotsForFiscalBook.mockResolvedValue({
        snapshots: [],
        total: 0,
        limit: 10,
        skip: 5,
      });

      await request(app).get('/api/fiscal-book/fb1/snapshots?tags=audit,test&limit=10&skip=5');

      expect(snapshotService.getSnapshotsForFiscalBook).toHaveBeenCalledWith('fb1', {
        limit: 10,
        skip: 5,
        tags: ['audit', 'test'],
      });
    });
  });

  // ===== GET /api/snapshots/:snapshotId =====
  describe('GET /api/snapshots/:snapshotId', () => {
    test('returns snapshot details', async () => {
      snapshotService.getSnapshotDetails.mockResolvedValue({ _id: 'snap1', snapshotName: 'Test' });

      const response = await request(app).get('/api/snapshots/snap1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.snapshotName).toBe('Test');
    });

    test('returns 404 when not found', async () => {
      snapshotService.getSnapshotDetails.mockResolvedValue(null);

      const response = await request(app).get('/api/snapshots/missing');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ===== DELETE /api/snapshots/:snapshotId =====
  describe('DELETE /api/snapshots/:snapshotId', () => {
    test('deletes snapshot', async () => {
      snapshotService.deleteSnapshot.mockResolvedValue({ _id: 'snap1' });

      const response = await request(app).delete('/api/snapshots/snap1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('returns 404 when not found', async () => {
      snapshotService.deleteSnapshot.mockResolvedValue(null);

      const response = await request(app).delete('/api/snapshots/missing');

      expect(response.status).toBe(404);
    });

    test('returns 400 for protected snapshot', async () => {
      snapshotService.deleteSnapshot.mockRejectedValue(new Error('Cannot delete protected snapshot'));

      const response = await request(app).delete('/api/snapshots/snap1');

      expect(response.status).toBe(400);
    });
  });

  // ===== GET /api/snapshots/:snapshotId/transactions =====
  describe('GET /api/snapshots/:snapshotId/transactions', () => {
    test('returns paginated transactions', async () => {
      snapshotService.getSnapshotTransactions.mockResolvedValue({
        transactions: [{ _id: 't1' }],
        total: 1,
        limit: 50,
        skip: 0,
      });

      const response = await request(app).get('/api/snapshots/snap1/transactions');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  // ===== GET /api/snapshots/:snapshotId/compare =====
  describe('GET /api/snapshots/:snapshotId/compare', () => {
    test('returns comparison data', async () => {
      snapshotService.compareSnapshotWithCurrent.mockResolvedValue({
        counts: { added: 1, removed: 0, modified: 0 },
      });

      const response = await request(app).get('/api/snapshots/snap1/compare');

      expect(response.status).toBe(200);
      expect(response.body.data.counts.added).toBe(1);
    });
  });

  // ===== PUT /api/snapshots/:snapshotId/tags =====
  describe('PUT /api/snapshots/:snapshotId/tags', () => {
    test('updates tags', async () => {
      snapshotService.updateTags.mockResolvedValue({ _id: 'snap1', tags: ['new'] });

      const response = await request(app)
        .put('/api/snapshots/snap1/tags')
        .send({ tags: ['new'] });

      expect(response.status).toBe(200);
      expect(snapshotService.updateTags).toHaveBeenCalledWith('snap1', ['new']);
    });

    test('validates tags is an array', async () => {
      const response = await request(app)
        .put('/api/snapshots/snap1/tags')
        .send({ tags: 'not-array' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Tags must be an array');
    });

    test('returns 404 when snapshot not found', async () => {
      snapshotService.updateTags.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/snapshots/snap1/tags')
        .send({ tags: [] });

      expect(response.status).toBe(404);
    });
  });

  // ===== PUT /api/snapshots/:snapshotId/protection =====
  describe('PUT /api/snapshots/:snapshotId/protection', () => {
    test('toggles protection', async () => {
      snapshotService.toggleProtection.mockResolvedValue({ _id: 'snap1', isProtected: true });

      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: true });

      expect(response.status).toBe(200);
      expect(snapshotService.toggleProtection).toHaveBeenCalledWith('snap1', true);
    });

    test('validates isProtected is boolean', async () => {
      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: 'yes' });

      expect(response.status).toBe(400);
    });
  });

  // ===== POST /api/snapshots/:snapshotId/annotations =====
  describe('POST /api/snapshots/:snapshotId/annotations', () => {
    test('adds annotation', async () => {
      snapshotService.addAnnotation.mockResolvedValue({ _id: 'snap1' });

      const response = await request(app)
        .post('/api/snapshots/snap1/annotations')
        .send({ content: 'Test note', createdBy: 'user1' });

      expect(response.status).toBe(201);
      expect(snapshotService.addAnnotation).toHaveBeenCalledWith('snap1', 'Test note', 'user1');
    });

    test('validates content is required', async () => {
      const response = await request(app)
        .post('/api/snapshots/snap1/annotations')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // ===== GET /api/snapshots/:snapshotId/export =====
  describe('GET /api/snapshots/:snapshotId/export', () => {
    test('returns JSON export', async () => {
      snapshotService.exportSnapshot.mockResolvedValue({
        format: 'json',
        contentType: 'application/json',
        data: '{}',
        fileName: 'snapshot.json',
      });

      const response = await request(app).get('/api/snapshots/snap1/export?format=json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('returns CSV export', async () => {
      snapshotService.exportSnapshot.mockResolvedValue({
        format: 'csv',
        contentType: 'text/csv',
        data: 'a,b,c',
        fileName: 'snapshot.csv',
      });

      const response = await request(app).get('/api/snapshots/snap1/export?format=csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  // ===== POST /api/snapshots/:snapshotId/clone =====
  describe('POST /api/snapshots/:snapshotId/clone', () => {
    test('clones to new fiscal book', async () => {
      snapshotService.cloneToNewFiscalBook.mockResolvedValue({ _id: 'fb2' });

      const response = await request(app)
        .post('/api/snapshots/snap1/clone')
        .send({ bookName: 'New Book' });

      expect(response.status).toBe(201);
      expect(snapshotService.cloneToNewFiscalBook).toHaveBeenCalledWith('snap1', { bookName: 'New Book' });
    });
  });

  // ===== POST /api/snapshots/:snapshotId/rollback =====
  describe('POST /api/snapshots/:snapshotId/rollback', () => {
    test('performs rollback', async () => {
      snapshotService.rollbackToSnapshot.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/snapshots/snap1/rollback')
        .send({ createPreRollbackSnapshot: true });

      expect(response.status).toBe(200);
      expect(snapshotService.rollbackToSnapshot).toHaveBeenCalledWith('snap1', {
        createPreRollbackSnapshot: true,
      });
    });
  });

  // ===== GET /api/fiscal-book/:fiscalBookId/snapshots/schedule =====
  describe('GET /api/fiscal-book/:fiscalBookId/snapshots/schedule', () => {
    test('returns schedule', async () => {
      snapshotSchedulerService.getSchedule.mockResolvedValue({ enabled: true });

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots/schedule');

      expect(response.status).toBe(200);
      expect(response.body.data.enabled).toBe(true);
    });
  });

  // ===== PUT /api/fiscal-book/:fiscalBookId/snapshots/schedule =====
  describe('PUT /api/fiscal-book/:fiscalBookId/snapshots/schedule', () => {
    test('updates schedule', async () => {
      snapshotSchedulerService.updateSchedule.mockResolvedValue({ enabled: true });

      const response = await request(app)
        .put('/api/fiscal-book/fb1/snapshots/schedule')
        .send({ enabled: true, frequency: 'weekly' });

      expect(response.status).toBe(200);
      expect(snapshotSchedulerService.updateSchedule).toHaveBeenCalledWith('fb1', {
        enabled: true,
        frequency: 'weekly',
      });
    });
  });
});
