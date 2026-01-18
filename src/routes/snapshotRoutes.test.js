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

      const response = await request(app).get('/api/snapshots/snap1/transactions?limit=25&skip=10');

      expect(response.status).toBe(200);
      expect(snapshotService.getSnapshotTransactions).toHaveBeenCalledWith('snap1', {
        limit: 25,
        skip: 10,
      });
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

    test('toggles protection off and uses unprotected message', async () => {
      snapshotService.toggleProtection.mockResolvedValue({ _id: 'snap1', isProtected: false });

      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: false });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Snapshot unprotected successfully');
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

    test('returns 500 on error', async () => {
      snapshotSchedulerService.updateSchedule.mockRejectedValue(new Error('Schedule update failed'));

      const response = await request(app)
        .put('/api/fiscal-book/fb1/snapshots/schedule')
        .send({ enabled: true });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Schedule update failed');
    });
  });

  // ===== Error paths for existing routes =====
  describe('Error paths', () => {
    test('GET /api/fiscal-book/:fiscalBookId/snapshots returns 500 on error', async () => {
      snapshotService.getSnapshotsForFiscalBook.mockRejectedValue(new Error('DB error'));

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('DB error');
    });

    test('GET /api/fiscal-book/:fiscalBookId/snapshots/schedule returns 500 on error', async () => {
      snapshotSchedulerService.getSchedule.mockRejectedValue(new Error('Schedule error'));

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots/schedule');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Schedule error');
    });

    test('GET /api/snapshots/:snapshotId returns 500 on error', async () => {
      snapshotService.getSnapshotDetails.mockRejectedValue(new Error('Details error'));

      const response = await request(app).get('/api/snapshots/snap1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/snapshots/:snapshotId/transactions returns 500 on error', async () => {
      snapshotService.getSnapshotTransactions.mockRejectedValue(new Error('Transactions error'));

      const response = await request(app).get('/api/snapshots/snap1/transactions');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/snapshots/:snapshotId/compare returns 500 on error', async () => {
      snapshotService.compareSnapshotWithCurrent.mockRejectedValue(new Error('Compare error'));

      const response = await request(app).get('/api/snapshots/snap1/compare');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('PUT /api/snapshots/:snapshotId/tags returns 500 on error', async () => {
      snapshotService.updateTags.mockRejectedValue(new Error('Tags error'));

      const response = await request(app)
        .put('/api/snapshots/snap1/tags')
        .send({ tags: ['test'] });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('PUT /api/snapshots/:snapshotId/protection returns 404 when not found', async () => {
      snapshotService.toggleProtection.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: true });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('PUT /api/snapshots/:snapshotId/protection returns 500 on error', async () => {
      snapshotService.toggleProtection.mockRejectedValue(new Error('Protection error'));

      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: false });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/snapshots/:snapshotId/annotations returns 404 when not found', async () => {
      snapshotService.addAnnotation.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/snapshots/snap1/annotations')
        .send({ content: 'Note', createdBy: 'user1' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/snapshots/:snapshotId/annotations returns 500 on error', async () => {
      snapshotService.addAnnotation.mockRejectedValue(new Error('Annotation error'));

      const response = await request(app)
        .post('/api/snapshots/snap1/annotations')
        .send({ content: 'Note', createdBy: 'user1' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/snapshots/:snapshotId/export returns 500 on error', async () => {
      snapshotService.exportSnapshot.mockRejectedValue(new Error('Export error'));

      const response = await request(app).get('/api/snapshots/snap1/export');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Export error');
    });

    test('POST /api/snapshots/:snapshotId/clone returns 500 on error', async () => {
      snapshotService.cloneToNewFiscalBook.mockRejectedValue(new Error('Clone error'));

      const response = await request(app)
        .post('/api/snapshots/snap1/clone')
        .send({ bookName: 'New Book' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clone error');
    });

    test('POST /api/snapshots/:snapshotId/rollback returns 500 on error', async () => {
      snapshotService.rollbackToSnapshot.mockRejectedValue(new Error('Rollback error'));

      const response = await request(app)
        .post('/api/snapshots/snap1/rollback')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rollback error');
    });
  });

  // ===== Fallback error message tests =====
  describe('Fallback error messages', () => {
    test('POST /api/fiscal-book/:fiscalBookId/snapshots uses fallback message', async () => {
      snapshotService.createFiscalBookSnapshot.mockRejectedValue({});

      const response = await request(app)
        .post('/api/fiscal-book/fb1/snapshots')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create snapshot');
    });

    test('GET /api/fiscal-book/:fiscalBookId/snapshots uses fallback message', async () => {
      snapshotService.getSnapshotsForFiscalBook.mockRejectedValue({});

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to get snapshots');
    });

    test('GET /api/fiscal-book/:fiscalBookId/snapshots/schedule uses fallback message', async () => {
      snapshotSchedulerService.getSchedule.mockRejectedValue({});

      const response = await request(app).get('/api/fiscal-book/fb1/snapshots/schedule');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to get schedule');
    });

    test('PUT /api/fiscal-book/:fiscalBookId/snapshots/schedule uses fallback message', async () => {
      snapshotSchedulerService.updateSchedule.mockRejectedValue({});

      const response = await request(app)
        .put('/api/fiscal-book/fb1/snapshots/schedule')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to update schedule');
    });

    test('GET /api/snapshots/:snapshotId uses fallback message', async () => {
      snapshotService.getSnapshotDetails.mockRejectedValue({});

      const response = await request(app).get('/api/snapshots/snap1');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to get snapshot details');
    });

    test('DELETE /api/snapshots/:snapshotId with non-protected error uses 500', async () => {
      snapshotService.deleteSnapshot.mockRejectedValue(new Error('Some other error'));

      const response = await request(app).delete('/api/snapshots/snap1');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Some other error');
    });

    test('GET /api/snapshots/:snapshotId/transactions uses fallback message', async () => {
      snapshotService.getSnapshotTransactions.mockRejectedValue({});

      const response = await request(app).get('/api/snapshots/snap1/transactions');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to get snapshot transactions');
    });

    test('GET /api/snapshots/:snapshotId/compare uses fallback message', async () => {
      snapshotService.compareSnapshotWithCurrent.mockRejectedValue({});

      const response = await request(app).get('/api/snapshots/snap1/compare');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to compare snapshot');
    });

    test('PUT /api/snapshots/:snapshotId/tags uses fallback message', async () => {
      snapshotService.updateTags.mockRejectedValue({});

      const response = await request(app)
        .put('/api/snapshots/snap1/tags')
        .send({ tags: [] });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to update tags');
    });

    test('PUT /api/snapshots/:snapshotId/protection uses fallback message', async () => {
      snapshotService.toggleProtection.mockRejectedValue({});

      const response = await request(app)
        .put('/api/snapshots/snap1/protection')
        .send({ isProtected: true });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to toggle protection');
    });

    test('POST /api/snapshots/:snapshotId/annotations uses fallback message', async () => {
      snapshotService.addAnnotation.mockRejectedValue({});

      const response = await request(app)
        .post('/api/snapshots/snap1/annotations')
        .send({ content: 'Note' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to add annotation');
    });

    test('POST /api/snapshots/:snapshotId/transactions/:transactionId/annotations uses fallback message', async () => {
      snapshotService.addTransactionAnnotation.mockRejectedValue({});

      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/t1/annotations')
        .send({ content: 'Note' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to add annotation');
    });

    test('GET /api/snapshots/:snapshotId/export uses fallback message', async () => {
      snapshotService.exportSnapshot.mockRejectedValue({});

      const response = await request(app).get('/api/snapshots/snap1/export');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to export snapshot');
    });

    test('POST /api/snapshots/:snapshotId/clone uses fallback message', async () => {
      snapshotService.cloneToNewFiscalBook.mockRejectedValue({});

      const response = await request(app)
        .post('/api/snapshots/snap1/clone')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to clone snapshot');
    });

    test('POST /api/snapshots/:snapshotId/rollback uses fallback message', async () => {
      snapshotService.rollbackToSnapshot.mockRejectedValue({});

      const response = await request(app)
        .post('/api/snapshots/snap1/rollback')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to rollback to snapshot');
    });
  });

  // ===== POST /api/snapshots/:snapshotId/transactions/:transactionId/annotations =====
  describe('POST /api/snapshots/:snapshotId/transactions/:transactionId/annotations', () => {
    test('adds transaction annotation', async () => {
      snapshotService.addTransactionAnnotation.mockResolvedValue({ _id: 't1' });

      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/t1/annotations')
        .send({ content: 'Transaction note', createdBy: 'user1' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(snapshotService.addTransactionAnnotation).toHaveBeenCalledWith('t1', 'Transaction note', 'user1');
    });

    test('validates content is required', async () => {
      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/t1/annotations')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Annotation content is required');
    });

    test('validates content must be string', async () => {
      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/t1/annotations')
        .send({ content: 123 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Annotation content is required');
    });

    test('returns 404 when transaction not found', async () => {
      snapshotService.addTransactionAnnotation.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/missing/annotations')
        .send({ content: 'Note', createdBy: 'user1' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Snapshot transaction not found');
    });

    test('returns 500 on error', async () => {
      snapshotService.addTransactionAnnotation.mockRejectedValue(new Error('Annotation error'));

      const response = await request(app)
        .post('/api/snapshots/snap1/transactions/t1/annotations')
        .send({ content: 'Note', createdBy: 'user1' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Annotation error');
    });
  });
});
