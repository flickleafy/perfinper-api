import { jest } from '@jest/globals';

const snapshotRepository = {
  createSnapshot: jest.fn(),
  createSnapshotTransactions: jest.fn(),
  findSnapshotsByFiscalBook: jest.fn(),
  countSnapshotsByFiscalBook: jest.fn(),
  findSnapshotById: jest.fn(),
  getSnapshotTransactions: jest.fn(),
  deleteSnapshot: jest.fn(),
  deleteSnapshotsByFiscalBook: jest.fn(),
  updateSnapshotTags: jest.fn(),
  setSnapshotProtection: jest.fn(),
  addSnapshotAnnotation: jest.fn(),
  addTransactionAnnotation: jest.fn(),
  getCurrentTransactions: jest.fn(),
  getFiscalBook: jest.fn(),
  getSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
};

const startSession = jest.fn();

// Mocked models for dynamic imports
const MockFiscalBookModel = function(data) {
  return {
    ...data,
    _id: 'newfb1',
    save: jest.fn().mockResolvedValue({ _id: 'newfb1', ...data }),
  };
};
MockFiscalBookModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

const MockTransactionModel = {
  insertMany: jest.fn().mockResolvedValue([]),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
};

jest.unstable_mockModule('../repository/snapshotRepository.js', () => snapshotRepository);

jest.unstable_mockModule('mongoose', () => ({
  default: { startSession },
}));

jest.unstable_mockModule('../models/FiscalBookModel.js', () => ({
  default: MockFiscalBookModel,
}));

jest.unstable_mockModule('../models/TransactionModel.js', () => ({
  default: MockTransactionModel,
}));

const service = await import('./snapshotService.js');
const {
  createFiscalBookSnapshot,
  getSnapshotsForFiscalBook,
  getSnapshotDetails,
  getSnapshotTransactions,
  compareSnapshotWithCurrent,
  deleteSnapshot,
  deleteSnapshotsByFiscalBook,
  updateTags,
  toggleProtection,
  addAnnotation,
  addTransactionAnnotation,
  exportSnapshot,
} = service;

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('snapshotService', () => {
  let session;

  beforeEach(() => {
    jest.clearAllMocks();
    session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  // ===== createFiscalBookSnapshot =====
  describe('createFiscalBookSnapshot', () => {
    test('creates snapshot with transactions', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue({
        _id: 'fb1',
        bookName: 'Test Book',
        bookType: 'Entrada',
        bookPeriod: '2024',
        status: 'Aberto',
      });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([
        { _id: 't1', transactionValue: '100', transactionType: 'credit' },
        { _id: 't2', transactionValue: '50', transactionType: 'debit' },
      ]);
      snapshotRepository.createSnapshot.mockResolvedValue({ _id: 'snap1' });
      snapshotRepository.createSnapshotTransactions.mockResolvedValue([]);

      const result = await createFiscalBookSnapshot('fb1', { name: 'Test' });

      expect(snapshotRepository.getFiscalBook).toHaveBeenCalledWith('fb1', session);
      expect(snapshotRepository.getCurrentTransactions).toHaveBeenCalledWith('fb1', session);
      expect(snapshotRepository.createSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          originalFiscalBookId: 'fb1',
          snapshotName: 'Test',
          statistics: expect.objectContaining({
            transactionCount: 2,
            totalIncome: 100,
            totalExpenses: 50,
          }),
        }),
        session
      );
      expect(session.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'snap1' });
    });

    test('handles empty transactions', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1', bookName: 'Test' });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([]);
      snapshotRepository.createSnapshot.mockResolvedValue({ _id: 'snap1' });

      const result = await createFiscalBookSnapshot('fb1');

      expect(snapshotRepository.createSnapshotTransactions).not.toHaveBeenCalled();
      expect(session.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'snap1' });
    });

    test('throws when fiscal book not found', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue(null);

      await expect(createFiscalBookSnapshot('fb1')).rejects.toThrow('Fiscal book not found.');
      expect(session.abortTransaction).toHaveBeenCalled();
    });

    test('aborts transaction on error', async () => {
      snapshotRepository.getFiscalBook.mockRejectedValue(new Error('db'));

      await expect(createFiscalBookSnapshot('fb1')).rejects.toThrow('db');
      expect(session.abortTransaction).toHaveBeenCalled();
      expect(session.endSession).toHaveBeenCalled();
    });
  });

  // ===== getSnapshotsForFiscalBook =====
  describe('getSnapshotsForFiscalBook', () => {
    test('returns snapshots with pagination', async () => {
      snapshotRepository.findSnapshotsByFiscalBook.mockResolvedValue([{ id: 'snap1' }]);
      snapshotRepository.countSnapshotsByFiscalBook.mockResolvedValue(1);

      const result = await getSnapshotsForFiscalBook('fb1', { limit: 10, skip: 0 });

      expect(result.snapshots).toEqual([{ id: 'snap1' }]);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0);
    });

    test('uses default pagination', async () => {
      snapshotRepository.findSnapshotsByFiscalBook.mockResolvedValue([]);
      snapshotRepository.countSnapshotsByFiscalBook.mockResolvedValue(0);

      const result = await getSnapshotsForFiscalBook('fb1');

      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
    });

    test('throws on error', async () => {
      snapshotRepository.findSnapshotsByFiscalBook.mockRejectedValue(new Error('db error'));

      await expect(getSnapshotsForFiscalBook('fb1')).rejects.toThrow('db error');
    });
  });

  // ===== getSnapshotDetails =====
  describe('getSnapshotDetails', () => {
    test('returns snapshot by ID', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({ id: 'snap1' });

      const result = await getSnapshotDetails('snap1');

      expect(snapshotRepository.findSnapshotById).toHaveBeenCalledWith('snap1');
      expect(result).toEqual({ id: 'snap1' });
    });

    test('throws on error', async () => {
      snapshotRepository.findSnapshotById.mockRejectedValue(new Error('db error'));

      await expect(getSnapshotDetails('snap1')).rejects.toThrow('db error');
    });
  });

  // ===== getSnapshotTransactions =====
  describe('getSnapshotTransactions', () => {
    test('returns paginated transactions', async () => {
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [],
        total: 0,
      });

      const result = await getSnapshotTransactions('snap1', { limit: 20 });

      expect(snapshotRepository.getSnapshotTransactions).toHaveBeenCalledWith('snap1', {
        limit: 20,
        skip: 0,
      });
      expect(result.transactions).toEqual([]);
    });

    test('throws on error', async () => {
      snapshotRepository.getSnapshotTransactions.mockRejectedValue(new Error('db error'));

      await expect(getSnapshotTransactions('snap1')).rejects.toThrow('db error');
    });
  });

  // ===== compareSnapshotWithCurrent =====
  describe('compareSnapshotWithCurrent', () => {
    test('computes added transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        originalFiscalBookId: 'fb1',
        statistics: { transactionCount: 0, totalIncome: 0, totalExpenses: 0, netAmount: 0 },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([
        { _id: 't1', transactionValue: '100', transactionType: 'credit' },
      ]);

      const result = await compareSnapshotWithCurrent('snap1');

      expect(result.counts.added).toBe(1);
      expect(result.counts.removed).toBe(0);
      expect(result.counts.modified).toBe(0);
    });

    test('computes removed transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        originalFiscalBookId: 'fb1',
        statistics: { transactionCount: 1, totalIncome: 100, totalExpenses: 0, netAmount: 100 },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [{ originalTransactionId: 't1', transactionData: { transactionValue: '100' } }],
      });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([]);

      const result = await compareSnapshotWithCurrent('snap1');

      expect(result.counts.added).toBe(0);
      expect(result.counts.removed).toBe(1);
    });

    test('throws when snapshot not found', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue(null);

      await expect(compareSnapshotWithCurrent('snap1')).rejects.toThrow('Snapshot not found.');
    });
  });

  // ===== deleteSnapshot =====
  describe('deleteSnapshot', () => {
    test('deletes snapshot', async () => {
      snapshotRepository.deleteSnapshot.mockResolvedValue({ id: 'snap1' });

      const result = await deleteSnapshot('snap1');

      expect(snapshotRepository.deleteSnapshot).toHaveBeenCalledWith('snap1');
      expect(result).toEqual({ id: 'snap1' });
    });

    test('throws on error', async () => {
      snapshotRepository.deleteSnapshot.mockRejectedValue(new Error('db error'));

      await expect(deleteSnapshot('snap1')).rejects.toThrow('db error');
    });
  });

  // ===== deleteSnapshotsByFiscalBook =====
  describe('deleteSnapshotsByFiscalBook', () => {
    test('deletes all snapshots and schedule', async () => {
      snapshotRepository.deleteSnapshotsByFiscalBook.mockResolvedValue({ deletedCount: 3 });
      snapshotRepository.deleteSchedule.mockResolvedValue(null);

      const result = await deleteSnapshotsByFiscalBook('fb1');

      expect(session.startTransaction).toHaveBeenCalled();
      expect(snapshotRepository.deleteSnapshotsByFiscalBook).toHaveBeenCalledWith('fb1', session);
      expect(snapshotRepository.deleteSchedule).toHaveBeenCalledWith('fb1', session);
      expect(session.commitTransaction).toHaveBeenCalled();
      expect(result.deletedCount).toBe(3);
    });

    test('aborts on error', async () => {
      snapshotRepository.deleteSnapshotsByFiscalBook.mockRejectedValue(new Error('db'));

      await expect(deleteSnapshotsByFiscalBook('fb1')).rejects.toThrow();
      expect(session.abortTransaction).toHaveBeenCalled();
    });
  });

  // ===== updateTags =====
  describe('updateTags', () => {
    test('normalizes and updates tags', async () => {
      snapshotRepository.updateSnapshotTags.mockResolvedValue({ id: 'snap1', tags: ['audit', 'test'] });

      const result = await updateTags('snap1', ['AUDIT', ' Test ']);

      expect(snapshotRepository.updateSnapshotTags).toHaveBeenCalledWith('snap1', ['audit', 'test']);
      expect(result).toEqual({ id: 'snap1', tags: ['audit', 'test'] });
    });

    test('throws on error', async () => {
      snapshotRepository.updateSnapshotTags.mockRejectedValue(new Error('db error'));

      await expect(updateTags('snap1', ['test'])).rejects.toThrow('db error');
    });
  });

  // ===== toggleProtection =====
  describe('toggleProtection', () => {
    test('updates protection status', async () => {
      snapshotRepository.setSnapshotProtection.mockResolvedValue({ id: 'snap1', isProtected: true });

      const result = await toggleProtection('snap1', true);

      expect(snapshotRepository.setSnapshotProtection).toHaveBeenCalledWith('snap1', true);
      expect(result.isProtected).toBe(true);
    });

    test('throws on error', async () => {
      snapshotRepository.setSnapshotProtection.mockRejectedValue(new Error('db error'));

      await expect(toggleProtection('snap1', true)).rejects.toThrow('db error');
    });
  });

  // ===== addAnnotation =====
  describe('addAnnotation', () => {
    test('adds annotation to snapshot', async () => {
      snapshotRepository.addSnapshotAnnotation.mockResolvedValue({ id: 'snap1' });

      const result = await addAnnotation('snap1', 'Note content', 'user1');

      expect(snapshotRepository.addSnapshotAnnotation).toHaveBeenCalledWith('snap1', {
        content: 'Note content',
        createdBy: 'user1',
      });
      expect(result).toEqual({ id: 'snap1' });
    });

    test('uses default createdBy', async () => {
      snapshotRepository.addSnapshotAnnotation.mockResolvedValue({ id: 'snap1' });

      await addAnnotation('snap1', 'Note');

      expect(snapshotRepository.addSnapshotAnnotation).toHaveBeenCalledWith('snap1', {
        content: 'Note',
        createdBy: 'system',
      });
    });

    test('throws on error', async () => {
      snapshotRepository.addSnapshotAnnotation.mockRejectedValue(new Error('db error'));

      await expect(addAnnotation('snap1', 'Note')).rejects.toThrow('db error');
    });
  });

  // ===== addTransactionAnnotation =====
  describe('addTransactionAnnotation', () => {
    test('adds annotation to transaction', async () => {
      snapshotRepository.addTransactionAnnotation.mockResolvedValue({ id: 't1' });

      const result = await addTransactionAnnotation('t1', 'Note', 'user1');

      expect(snapshotRepository.addTransactionAnnotation).toHaveBeenCalledWith('t1', {
        content: 'Note',
        createdBy: 'user1',
      });
      expect(result).toEqual({ id: 't1' });
    });

    test('throws on error', async () => {
      snapshotRepository.addTransactionAnnotation.mockRejectedValue(new Error('db error'));

      await expect(addTransactionAnnotation('t1', 'Note')).rejects.toThrow('db error');
    });
  });

  // ===== exportSnapshot =====
  describe('exportSnapshot', () => {
    test('generates JSON export', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        createdAt: new Date('2024-01-15'),
        fiscalBookData: {},
        statistics: {},
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });

      const result = await exportSnapshot('snap1', 'json');

      expect(result.format).toBe('json');
      expect(result.contentType).toBe('application/json');
      expect(result.fileName).toContain('snapshot-Test');
    });

    test('generates CSV export', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        createdAt: new Date('2024-01-15'),
        fiscalBookData: {},
        statistics: {},
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [{
          transactionData: {
            transactionDate: new Date(),
            transactionName: 'Test',
            transactionValue: '100',
          },
        }],
      });

      const result = await exportSnapshot('snap1', 'csv');

      expect(result.format).toBe('csv');
      expect(result.contentType).toBe('text/csv');
      expect(result.data).toContain('Date,Name');
    });

    test('throws when snapshot not found', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue(null);

      await expect(exportSnapshot('snap1')).rejects.toThrow('Snapshot not found.');
    });

    test('throws for unsupported format', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        createdAt: new Date(),
        fiscalBookData: {},
        statistics: {},
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });

      await expect(exportSnapshot('snap1', 'pdf')).rejects.toThrow('PDF export not yet implemented.');
    });
  });

  // ===== cloneToNewFiscalBook =====
  // Note: These tests are limited because the function dynamically imports models.
  // Only error paths before model import can be tested without full integration test setup.
  describe('cloneToNewFiscalBook', () => {
    test('throws when snapshot not found', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue(null);

      await expect(service.cloneToNewFiscalBook('snap1')).rejects.toThrow('Snapshot not found.');
      expect(session.abortTransaction).toHaveBeenCalled();
    });

    test('clones snapshot to new fiscal book with transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Original Book',
        fiscalBookData: {
          bookName: 'Test Book',
          bookType: 'Entrada',
          bookPeriod: '2024',
          reference: 'REF001',
          status: 'Fechado',
          fiscalData: {},
          companyId: 'comp1',
          notes: 'Notes',
        },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [
          { transactionData: { transactionName: 'TX1', transactionValue: 100 } },
          { transactionData: { transactionName: 'TX2', transactionValue: 200 } },
        ],
      });

      const result = await service.cloneToNewFiscalBook('snap1', { bookName: 'Cloned Book' });

      expect(result._id).toBe('newfb1');
      expect(result.bookName).toBe('Cloned Book');
      expect(session.commitTransaction).toHaveBeenCalled();
    });

    test('clones snapshot without transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        fiscalBookData: { bookName: 'Test', bookType: 'Entrada' },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });

      const result = await service.cloneToNewFiscalBook('snap1');

      expect(result.bookName).toBe('Test (Cópia)');
      expect(session.commitTransaction).toHaveBeenCalled();
    });
  });

  // ===== rollbackToSnapshot =====
  // Note: Limited tests due to dynamic model imports in the function.
  describe('rollbackToSnapshot', () => {
    test('throws when snapshot not found', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue(null);

      await expect(service.rollbackToSnapshot('snap1')).rejects.toThrow('Snapshot not found.');
      expect(session.abortTransaction).toHaveBeenCalled();
    });

    test('throws when original fiscal book not found', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        originalFiscalBookId: 'fb1',
        snapshotName: 'Test',
      });
      snapshotRepository.getFiscalBook.mockResolvedValue(null);

      await expect(service.rollbackToSnapshot('snap1')).rejects.toThrow('Original fiscal book not found.');
      expect(session.abortTransaction).toHaveBeenCalled();
    });

    test('rolls back to snapshot without pre-rollback snapshot', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        originalFiscalBookId: 'fb1',
        snapshotName: 'Test Snapshot',
        fiscalBookData: {
          bookName: 'Original Book',
          bookType: 'Entrada',
          reference: 'REF',
          status: 'Fechado',
          fiscalData: {},
          notes: 'Notes',
        },
      });
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1' });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [
          { transactionData: { transactionName: 'TX1' } },
        ],
      });

      const result = await service.rollbackToSnapshot('snap1', { createPreRollbackSnapshot: false });

      expect(result.success).toBe(true);
      expect(result.fiscalBookId).toBe('fb1');
      expect(result.restoredFromSnapshot).toBe('snap1');
      expect(result.restoredTransactionCount).toBe(1);
      expect(session.commitTransaction).toHaveBeenCalled();
    });

    test('rolls back to snapshot without transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        originalFiscalBookId: 'fb1',
        snapshotName: 'Empty Snapshot',
        fiscalBookData: { bookName: 'Book', bookType: 'Entrada' },
      });
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1' });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });

      const result = await service.rollbackToSnapshot('snap1', { createPreRollbackSnapshot: false });

      expect(result.success).toBe(true);
      expect(result.restoredTransactionCount).toBe(0);
    });

    test('rolls back to snapshot with pre-rollback snapshot creation', async () => {
      // Mock for the snapshot being rolled back to
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        originalFiscalBookId: 'fb1',
        snapshotName: 'Target Snapshot',
        fiscalBookData: { bookName: 'Book', bookType: 'Entrada', status: 'Fechado' },
      });
      snapshotRepository.getFiscalBook.mockResolvedValue({
        _id: 'fb1',
        bookName: 'Current Book',
        bookType: 'Entrada',
        status: 'Aberto',
      });
      // For createFiscalBookSnapshot
      snapshotRepository.getCurrentTransactions.mockResolvedValue([]);
      snapshotRepository.createSnapshot.mockResolvedValue({ _id: 'prerollback-snap' });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });

      const result = await service.rollbackToSnapshot('snap1', { createPreRollbackSnapshot: true });

      expect(result.success).toBe(true);
      expect(result.preRollbackSnapshotId).toBe('prerollback-snap');
    });
  });

  // ===== compareSnapshotWithCurrent (additional edge cases) =====
  describe('compareSnapshotWithCurrent (edge cases)', () => {
    test('detects modified transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        originalFiscalBookId: 'fb1',
        statistics: { transactionCount: 1, totalIncome: 100, totalExpenses: 0, netAmount: 100 },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [{
          originalTransactionId: 't1',
          transactionData: { transactionName: 'Original Name', transactionValue: '100' },
        }],
      });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([
        { _id: 't1', transactionName: 'Changed Name', transactionValue: '100' },
      ]);

      const result = await compareSnapshotWithCurrent('snap1');

      expect(result.counts.modified).toBe(1);
      expect(result.modified[0].changes).toContainEqual(
        expect.objectContaining({ field: 'transactionName', oldValue: 'Original Name', newValue: 'Changed Name' })
      );
    });

    test('handles transactions with null values', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        originalFiscalBookId: 'fb1',
        statistics: { transactionCount: 0, totalIncome: 0, totalExpenses: 0, netAmount: 0 },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({ transactions: [] });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([
        { _id: 't1', transactionValue: null, transactionType: 'credit' },
      ]);

      const result = await compareSnapshotWithCurrent('snap1');

      expect(result.counts.added).toBe(1);
    });

    test('detects unchanged transactions', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({
        _id: 'snap1',
        snapshotName: 'Test',
        originalFiscalBookId: 'fb1',
        statistics: { transactionCount: 1, totalIncome: 100, totalExpenses: 0, netAmount: 100 },
      });
      snapshotRepository.getSnapshotTransactions.mockResolvedValue({
        transactions: [{
          originalTransactionId: 't1',
          transactionData: { transactionName: 'Same Name', transactionValue: '100' },
        }],
      });
      snapshotRepository.getCurrentTransactions.mockResolvedValue([
        { _id: 't1', transactionName: 'Same Name', transactionValue: '100' },
      ]);

      const result = await compareSnapshotWithCurrent('snap1');

      expect(result.counts.unchanged).toBe(1);
      expect(result.counts.modified).toBe(0);
    });

    test('throws on error', async () => {
      snapshotRepository.findSnapshotById.mockRejectedValue(new Error('db error'));

      await expect(compareSnapshotWithCurrent('snap1')).rejects.toThrow('db error');
    });
  });
});

