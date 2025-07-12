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

jest.unstable_mockModule('../repository/snapshotRepository.js', () => snapshotRepository);

jest.unstable_mockModule('mongoose', () => ({
  default: { startSession },
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
  });

  // ===== getSnapshotDetails =====
  describe('getSnapshotDetails', () => {
    test('returns snapshot by ID', async () => {
      snapshotRepository.findSnapshotById.mockResolvedValue({ id: 'snap1' });

      const result = await getSnapshotDetails('snap1');

      expect(snapshotRepository.findSnapshotById).toHaveBeenCalledWith('snap1');
      expect(result).toEqual({ id: 'snap1' });
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
  });

  // ===== toggleProtection =====
  describe('toggleProtection', () => {
    test('updates protection status', async () => {
      snapshotRepository.setSnapshotProtection.mockResolvedValue({ id: 'snap1', isProtected: true });

      const result = await toggleProtection('snap1', true);

      expect(snapshotRepository.setSnapshotProtection).toHaveBeenCalledWith('snap1', true);
      expect(result.isProtected).toBe(true);
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
});
