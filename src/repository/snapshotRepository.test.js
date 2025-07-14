import { jest } from '@jest/globals';

// Mock models
const FiscalBookSnapshotModel = jest.fn(function (data) {
  this.data = data;
  this._id = 'snap1';
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

FiscalBookSnapshotModel.find = jest.fn();
FiscalBookSnapshotModel.findById = jest.fn();
FiscalBookSnapshotModel.findByIdAndUpdate = jest.fn();
FiscalBookSnapshotModel.findByIdAndDelete = jest.fn();
FiscalBookSnapshotModel.countDocuments = jest.fn();
FiscalBookSnapshotModel.deleteMany = jest.fn();

const SnapshotTransactionModel = jest.fn();
SnapshotTransactionModel.insertMany = jest.fn();
SnapshotTransactionModel.find = jest.fn();
SnapshotTransactionModel.findByIdAndUpdate = jest.fn();
SnapshotTransactionModel.countDocuments = jest.fn();
SnapshotTransactionModel.deleteMany = jest.fn();

const SnapshotScheduleModel = jest.fn();
SnapshotScheduleModel.findOne = jest.fn();
SnapshotScheduleModel.findOneAndUpdate = jest.fn();
SnapshotScheduleModel.findOneAndDelete = jest.fn();
SnapshotScheduleModel.find = jest.fn();
SnapshotScheduleModel.findByIdAndUpdate = jest.fn();

const TransactionModel = jest.fn();
TransactionModel.find = jest.fn();

const FiscalBookModel = jest.fn();
FiscalBookModel.findById = jest.fn();

jest.unstable_mockModule('../models/FiscalBookSnapshotModel.js', () => ({
  default: FiscalBookSnapshotModel,
}));

jest.unstable_mockModule('../models/SnapshotTransactionModel.js', () => ({
  default: SnapshotTransactionModel,
}));

jest.unstable_mockModule('../models/SnapshotScheduleModel.js', () => ({
  default: SnapshotScheduleModel,
}));

jest.unstable_mockModule('../models/TransactionModel.js', () => ({
  default: TransactionModel,
}));

jest.unstable_mockModule('../models/FiscalBookModel.js', () => ({
  default: FiscalBookModel,
}));

const repository = await import('./snapshotRepository.js');
const {
  createSnapshot,
  createSnapshotTransactions,
  findSnapshotsByFiscalBook,
  countSnapshotsByFiscalBook,
  findSnapshotById,
  getSnapshotTransactions,
  deleteSnapshot,
  deleteSnapshotsByFiscalBook,
  updateSnapshotTags,
  setSnapshotProtection,
  addSnapshotAnnotation,
  addTransactionAnnotation,
  getCurrentTransactions,
  getFiscalBook,
  getSchedule,
  upsertSchedule,
  deleteSchedule,
  findDueSchedules,
  updateScheduleExecution,
  findSnapshotsToCleanup,
} = repository;

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

const makeQuery = (result) => ({
  session: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

const makeExecQuery = (result) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

describe('snapshotRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  // ===== createSnapshot =====
  describe('createSnapshot', () => {
    test('creates snapshot without session', async () => {
      const result = await createSnapshot({ snapshotName: 'Test' });

      const instance = FiscalBookSnapshotModel.mock.instances[0];
      expect(instance.save).toHaveBeenCalledWith();
      expect(result).toBe(instance);
    });

    test('creates snapshot with session', async () => {
      const session = { id: 's' };
      const result = await createSnapshot({ snapshotName: 'Test' }, session);

      const instance = FiscalBookSnapshotModel.mock.instances[0];
      expect(instance.save).toHaveBeenCalledWith({ session });
      expect(result).toBe(instance);
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.mockImplementationOnce(() => ({
        save: jest.fn().mockRejectedValue(new Error('db error')),
      }));

      await expect(createSnapshot({})).rejects.toThrow('Failed to create snapshot.');
    });
  });

  // ===== createSnapshotTransactions =====
  describe('createSnapshotTransactions', () => {
    test('bulk inserts transactions', async () => {
      SnapshotTransactionModel.insertMany.mockResolvedValue([{ id: 't1' }]);

      const result = await createSnapshotTransactions([{ data: 'test' }]);

      expect(SnapshotTransactionModel.insertMany).toHaveBeenCalledWith([{ data: 'test' }]);
      expect(result).toEqual([{ id: 't1' }]);
    });

    test('bulk inserts with session', async () => {
      SnapshotTransactionModel.insertMany.mockResolvedValue([{ id: 't1' }]);
      const session = { id: 's' };

      const result = await createSnapshotTransactions([{ data: 'test' }], session);

      expect(SnapshotTransactionModel.insertMany).toHaveBeenCalledWith([{ data: 'test' }], { session });
      expect(result).toEqual([{ id: 't1' }]);
    });

    test('throws on error', async () => {
      SnapshotTransactionModel.insertMany.mockRejectedValue(new Error('db'));

      await expect(createSnapshotTransactions([])).rejects.toThrow('Failed to create snapshot transactions.');
    });
  });

  // ===== findSnapshotsByFiscalBook =====
  describe('findSnapshotsByFiscalBook', () => {
    test('returns snapshots with options', async () => {
      const query = makeQuery([{ id: 'snap1' }]);
      FiscalBookSnapshotModel.find.mockReturnValue(query);

      const result = await findSnapshotsByFiscalBook('fb1', { limit: 10, skip: 5 });

      expect(FiscalBookSnapshotModel.find).toHaveBeenCalledWith({ originalFiscalBookId: 'fb1' });
      expect(query.limit).toHaveBeenCalledWith(10);
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: 'snap1' }]);
    });

    test('applies tag filter', async () => {
      const query = makeQuery([]);
      FiscalBookSnapshotModel.find.mockReturnValue(query);

      await findSnapshotsByFiscalBook('fb1', { tags: ['audit'] });

      expect(FiscalBookSnapshotModel.find).toHaveBeenCalledWith({
        originalFiscalBookId: 'fb1',
        tags: { $all: ['audit'] },
      });
    });

    test('supports session', async () => {
      const query = makeQuery([]);
      FiscalBookSnapshotModel.find.mockReturnValue(query);
      const session = { id: 's' };

      await findSnapshotsByFiscalBook('fb1', {}, session);

      expect(query.session).toHaveBeenCalledWith(session);
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(findSnapshotsByFiscalBook('fb1')).rejects.toThrow('Failed to retrieve snapshots for fiscal book.');
    });
  });

  // ===== countSnapshotsByFiscalBook =====
  describe('countSnapshotsByFiscalBook', () => {
    test('returns count', async () => {
      const query = makeExecQuery(5);
      FiscalBookSnapshotModel.countDocuments.mockReturnValue(query);

      const result = await countSnapshotsByFiscalBook('fb1');

      expect(FiscalBookSnapshotModel.countDocuments).toHaveBeenCalledWith({ originalFiscalBookId: 'fb1' });
      expect(result).toBe(5);
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.countDocuments.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(countSnapshotsByFiscalBook('fb1')).rejects.toThrow('Failed to count snapshots for fiscal book.');
    });

    test('supports session', async () => {
      const query = makeExecQuery(3);
      FiscalBookSnapshotModel.countDocuments.mockReturnValue(query);
      const session = { id: 's' };

      const result = await countSnapshotsByFiscalBook('fb1', session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toBe(3);
    });
  });

  // ===== findSnapshotById =====
  describe('findSnapshotById', () => {
    test('returns snapshot', async () => {
      FiscalBookSnapshotModel.findById.mockResolvedValue({ id: 'snap1' });

      const result = await findSnapshotById('snap1');

      expect(FiscalBookSnapshotModel.findById).toHaveBeenCalledWith('snap1');
      expect(result).toEqual({ id: 'snap1' });
    });

    test('returns null when missing', async () => {
      FiscalBookSnapshotModel.findById.mockResolvedValue(null);

      const result = await findSnapshotById('missing');

      expect(result).toBeNull();
    });

    test('supports session', async () => {
      const query = { session: jest.fn().mockResolvedValue({ id: 'snap1' }) };
      FiscalBookSnapshotModel.findById.mockReturnValue(query);
      const session = { id: 's' };

      const result = await findSnapshotById('snap1', session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toEqual({ id: 'snap1' });
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.findById.mockRejectedValue(new Error('db'));

      await expect(findSnapshotById('snap1')).rejects.toThrow('An error occurred while finding the snapshot by ID.');
    });
  });

  // ===== getSnapshotTransactions =====
  describe('getSnapshotTransactions', () => {
    test('returns paginated transactions', async () => {
      const query = makeQuery([{ id: 't1' }]);
      SnapshotTransactionModel.find.mockReturnValue(query);
      // countDocuments().session() returns a thenable that resolves to the count
      const countQuery = {
        session: jest.fn().mockResolvedValue(1),
      };
      SnapshotTransactionModel.countDocuments.mockReturnValue(countQuery);

      const result = await getSnapshotTransactions('snap1', { limit: 10, skip: 0 });

      expect(SnapshotTransactionModel.find).toHaveBeenCalledWith({ snapshotId: 'snap1' });
      expect(result.transactions).toEqual([{ id: 't1' }]);
      expect(result.total).toBe(1);
    });

    test('throws on error', async () => {
      SnapshotTransactionModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(getSnapshotTransactions('snap1')).rejects.toThrow('Failed to retrieve snapshot transactions.');
    });

    test('supports session', async () => {
      const query = makeQuery([{ id: 't1' }]);
      SnapshotTransactionModel.find.mockReturnValue(query);
      const countQuery = { session: jest.fn().mockResolvedValue(1) };
      SnapshotTransactionModel.countDocuments.mockReturnValue(countQuery);
      const session = { id: 's' };

      const result = await getSnapshotTransactions('snap1', {}, session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(countQuery.session).toHaveBeenCalledWith(session);
      expect(result.transactions).toEqual([{ id: 't1' }]);
    });
  });

  // ===== deleteSnapshot =====
  describe('deleteSnapshot', () => {
    test('deletes snapshot and transactions', async () => {
      FiscalBookSnapshotModel.findById.mockResolvedValue({ _id: 'snap1', isProtected: false });
      SnapshotTransactionModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      FiscalBookSnapshotModel.findByIdAndDelete.mockResolvedValue({ id: 'snap1' });

      const result = await deleteSnapshot('snap1');

      expect(SnapshotTransactionModel.deleteMany).toHaveBeenCalledWith({ snapshotId: 'snap1' }, {});
      expect(FiscalBookSnapshotModel.findByIdAndDelete).toHaveBeenCalledWith('snap1', {});
      expect(result).toEqual({ id: 'snap1' });
    });

    test('returns null when snapshot not found', async () => {
      FiscalBookSnapshotModel.findById.mockResolvedValue(null);

      const result = await deleteSnapshot('missing');

      expect(result).toBeNull();
    });

    test('throws when snapshot is protected', async () => {
      FiscalBookSnapshotModel.findById.mockResolvedValue({ _id: 'snap1', isProtected: true });

      await expect(deleteSnapshot('snap1')).rejects.toThrow('Cannot delete a protected snapshot');
    });

    test('supports session', async () => {
      const sessionQuery = { session: jest.fn().mockResolvedValue({ _id: 'snap1', isProtected: false }) };
      FiscalBookSnapshotModel.findById.mockReturnValue(sessionQuery);
      SnapshotTransactionModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
      FiscalBookSnapshotModel.findByIdAndDelete.mockResolvedValue({ id: 'snap1' });
      const session = { id: 's' };

      const result = await deleteSnapshot('snap1', session);

      expect(sessionQuery.session).toHaveBeenCalledWith(session);
      expect(SnapshotTransactionModel.deleteMany).toHaveBeenCalledWith({ snapshotId: 'snap1' }, { session });
      expect(FiscalBookSnapshotModel.findByIdAndDelete).toHaveBeenCalledWith('snap1', { session });
      expect(result).toEqual({ id: 'snap1' });
    });
  });

  // ===== deleteSnapshotsByFiscalBook =====
  describe('deleteSnapshotsByFiscalBook', () => {
    test('deletes all snapshots and their transactions for a fiscal book', async () => {
      const snapshotsQuery = makeQuery([{ _id: 'snap1' }, { _id: 'snap2' }]);
      FiscalBookSnapshotModel.find.mockReturnValue(snapshotsQuery);
      SnapshotTransactionModel.deleteMany.mockResolvedValue({ deletedCount: 10 });
      FiscalBookSnapshotModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const result = await deleteSnapshotsByFiscalBook('fb1');

      expect(FiscalBookSnapshotModel.find).toHaveBeenCalledWith({ originalFiscalBookId: 'fb1' });
      expect(SnapshotTransactionModel.deleteMany).toHaveBeenCalledWith(
        { snapshotId: { $in: ['snap1', 'snap2'] } },
        {}
      );
      expect(FiscalBookSnapshotModel.deleteMany).toHaveBeenCalledWith(
        { originalFiscalBookId: 'fb1' },
        {}
      );
      expect(result.deletedCount).toBe(2);
    });

    test('supports session', async () => {
      const snapshotsQuery = makeQuery([{ _id: 'snap1' }]);
      FiscalBookSnapshotModel.find.mockReturnValue(snapshotsQuery);
      SnapshotTransactionModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      FiscalBookSnapshotModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      const session = { id: 's' };

      const result = await deleteSnapshotsByFiscalBook('fb1', session);

      expect(snapshotsQuery.session).toHaveBeenCalledWith(session);
      expect(SnapshotTransactionModel.deleteMany).toHaveBeenCalledWith(
        { snapshotId: { $in: ['snap1'] } },
        { session }
      );
      expect(FiscalBookSnapshotModel.deleteMany).toHaveBeenCalledWith(
        { originalFiscalBookId: 'fb1' },
        { session }
      );
      expect(result.deletedCount).toBe(1);
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(deleteSnapshotsByFiscalBook('fb1')).rejects.toThrow('Failed to delete snapshots for fiscal book.');
    });
  });

  // ===== updateSnapshotTags =====
  describe('updateSnapshotTags', () => {
    test('updates tags', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1', tags: ['new'] });

      const result = await updateSnapshotTags('snap1', ['new']);

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        { tags: ['new'] },
        { new: true }
      );
      expect(result).toEqual({ id: 'snap1', tags: ['new'] });
    });

    test('returns null when missing', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue(null);

      const result = await updateSnapshotTags('missing', []);

      expect(result).toBeNull();
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

      await expect(updateSnapshotTags('snap1', [])).rejects.toThrow('Failed to update snapshot tags.');
    });

    test('supports session', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1', tags: ['tag'] });
      const session = { id: 's' };

      const result = await updateSnapshotTags('snap1', ['tag'], session);

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        { tags: ['tag'] },
        { new: true, session }
      );
      expect(result).toEqual({ id: 'snap1', tags: ['tag'] });
    });
  });

  // ===== setSnapshotProtection =====
  describe('setSnapshotProtection', () => {
    test('updates protection status', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1', isProtected: true });

      const result = await setSnapshotProtection('snap1', true);

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        { isProtected: true },
        { new: true }
      );
      expect(result).toEqual({ id: 'snap1', isProtected: true });
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

      await expect(setSnapshotProtection('snap1', false)).rejects.toThrow('Failed to update snapshot protection status.');
    });

    test('supports session', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1', isProtected: true });
      const session = { id: 's' };

      const result = await setSnapshotProtection('snap1', true, session);

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        { isProtected: true },
        { new: true, session }
      );
      expect(result).toEqual({ id: 'snap1', isProtected: true });
    });
  });

  // ===== addSnapshotAnnotation =====
  describe('addSnapshotAnnotation', () => {
    test('adds annotation to snapshot', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1', annotations: [{ content: 'note' }] });

      const result = await addSnapshotAnnotation('snap1', { content: 'note', createdBy: 'user' });

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        {
          $push: {
            annotations: expect.objectContaining({
              content: 'note',
              createdBy: 'user',
            }),
          },
        },
        { new: true }
      );
      expect(result).toBeDefined();
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

      await expect(addSnapshotAnnotation('snap1', {})).rejects.toThrow('Failed to add annotation to snapshot.');
    });

    test('supports session', async () => {
      FiscalBookSnapshotModel.findByIdAndUpdate.mockResolvedValue({ id: 'snap1' });
      const session = { id: 's' };

      const result = await addSnapshotAnnotation('snap1', { content: 'note', createdBy: 'user' }, session);

      expect(FiscalBookSnapshotModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'snap1',
        { $push: { annotations: expect.any(Object) } },
        { new: true, session }
      );
      expect(result).toEqual({ id: 'snap1' });
    });
  });

  // ===== addTransactionAnnotation =====
  describe('addTransactionAnnotation', () => {
    test('adds annotation to transaction', async () => {
      SnapshotTransactionModel.findByIdAndUpdate.mockResolvedValue({ id: 't1', annotations: [{ content: 'note' }] });

      const result = await addTransactionAnnotation('t1', { content: 'note', createdBy: 'user' });

      expect(SnapshotTransactionModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('throws on error', async () => {
      SnapshotTransactionModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

      await expect(addTransactionAnnotation('t1', {})).rejects.toThrow('Failed to add annotation to snapshot transaction.');
    });

    test('supports session', async () => {
      SnapshotTransactionModel.findByIdAndUpdate.mockResolvedValue({ id: 't1' });
      const session = { id: 's' };

      const result = await addTransactionAnnotation('t1', { content: 'note', createdBy: 'user' }, session);

      expect(SnapshotTransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        't1',
        { $push: { annotations: expect.any(Object) } },
        { new: true, session }
      );
      expect(result).toEqual({ id: 't1' });
    });
  });

  // ===== getCurrentTransactions =====
  describe('getCurrentTransactions', () => {
    test('returns transactions', async () => {
      const query = makeExecQuery([{ id: 't1' }]);
      TransactionModel.find.mockReturnValue(query);

      const result = await getCurrentTransactions('fb1');

      expect(TransactionModel.find).toHaveBeenCalledWith({ fiscalBookId: 'fb1' });
      expect(result).toEqual([{ id: 't1' }]);
    });

    test('throws on error', async () => {
      TransactionModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(getCurrentTransactions('fb1')).rejects.toThrow('Failed to retrieve current transactions.');
    });

    test('supports session', async () => {
      const query = makeExecQuery([{ id: 't1' }]);
      TransactionModel.find.mockReturnValue(query);
      const session = { id: 's' };

      const result = await getCurrentTransactions('fb1', session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toEqual([{ id: 't1' }]);
    });
  });

  // ===== getFiscalBook =====
  describe('getFiscalBook', () => {
    test('returns fiscal book', async () => {
      FiscalBookModel.findById.mockResolvedValue({ id: 'fb1' });

      const result = await getFiscalBook('fb1');

      expect(FiscalBookModel.findById).toHaveBeenCalledWith('fb1');
      expect(result).toEqual({ id: 'fb1' });
    });

    test('returns null when missing', async () => {
      FiscalBookModel.findById.mockResolvedValue(null);

      const result = await getFiscalBook('missing');

      expect(result).toBeNull();
    });

    test('throws on error', async () => {
      FiscalBookModel.findById.mockRejectedValue(new Error('db'));

      await expect(getFiscalBook('fb1')).rejects.toThrow('An error occurred while finding the fiscal book.');
    });

    test('supports session', async () => {
      const sessionQuery = { session: jest.fn().mockResolvedValue({ id: 'fb1' }) };
      FiscalBookModel.findById.mockReturnValue(sessionQuery);
      const session = { id: 's' };

      const result = await getFiscalBook('fb1', session);

      expect(sessionQuery.session).toHaveBeenCalledWith(session);
      expect(result).toEqual({ id: 'fb1' });
    });
  });

  // ===== getSchedule =====
  describe('getSchedule', () => {
    test('returns schedule', async () => {
      const query = makeExecQuery({ fiscalBookId: 'fb1', enabled: true });
      SnapshotScheduleModel.findOne.mockReturnValue(query);

      const result = await getSchedule('fb1');

      expect(SnapshotScheduleModel.findOne).toHaveBeenCalledWith({ fiscalBookId: 'fb1' });
      expect(result).toEqual({ fiscalBookId: 'fb1', enabled: true });
    });

    test('throws on error', async () => {
      SnapshotScheduleModel.findOne.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(getSchedule('fb1')).rejects.toThrow('Failed to retrieve snapshot schedule.');
    });

    test('supports session', async () => {
      const query = makeExecQuery({ fiscalBookId: 'fb1' });
      SnapshotScheduleModel.findOne.mockReturnValue(query);
      const session = { id: 's' };

      const result = await getSchedule('fb1', session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toEqual({ fiscalBookId: 'fb1' });
    });
  });

  // ===== upsertSchedule =====
  describe('upsertSchedule', () => {
    test('creates or updates schedule', async () => {
      SnapshotScheduleModel.findOneAndUpdate.mockResolvedValue({ fiscalBookId: 'fb1' });

      const result = await upsertSchedule('fb1', { enabled: true });

      expect(SnapshotScheduleModel.findOneAndUpdate).toHaveBeenCalledWith(
        { fiscalBookId: 'fb1' },
        { enabled: true, fiscalBookId: 'fb1' },
        { new: true, upsert: true }
      );
      expect(result).toEqual({ fiscalBookId: 'fb1' });
    });

    test('throws on error', async () => {
      SnapshotScheduleModel.findOneAndUpdate.mockRejectedValue(new Error('db'));

      await expect(upsertSchedule('fb1', {})).rejects.toThrow('Failed to update snapshot schedule.');
    });

    test('supports session', async () => {
      SnapshotScheduleModel.findOneAndUpdate.mockResolvedValue({ fiscalBookId: 'fb1' });
      const session = { id: 's' };

      const result = await upsertSchedule('fb1', { enabled: true }, session);

      expect(SnapshotScheduleModel.findOneAndUpdate).toHaveBeenCalledWith(
        { fiscalBookId: 'fb1' },
        { enabled: true, fiscalBookId: 'fb1' },
        { new: true, upsert: true, session }
      );
      expect(result).toEqual({ fiscalBookId: 'fb1' });
    });
  });

  // ===== deleteSchedule =====
  describe('deleteSchedule', () => {
    test('deletes schedule', async () => {
      SnapshotScheduleModel.findOneAndDelete.mockResolvedValue({ fiscalBookId: 'fb1' });

      const result = await deleteSchedule('fb1');

      expect(SnapshotScheduleModel.findOneAndDelete).toHaveBeenCalledWith({ fiscalBookId: 'fb1' }, {});
      expect(result).toEqual({ fiscalBookId: 'fb1' });
    });

    test('returns null when missing', async () => {
      SnapshotScheduleModel.findOneAndDelete.mockResolvedValue(null);

      const result = await deleteSchedule('missing');

      expect(result).toBeNull();
    });

    test('throws on error', async () => {
      SnapshotScheduleModel.findOneAndDelete.mockRejectedValue(new Error('db'));

      await expect(deleteSchedule('fb1')).rejects.toThrow('Failed to delete snapshot schedule.');
    });

    test('supports session', async () => {
      SnapshotScheduleModel.findOneAndDelete.mockResolvedValue({ fiscalBookId: 'fb1' });
      const session = { id: 's' };

      const result = await deleteSchedule('fb1', session);

      expect(SnapshotScheduleModel.findOneAndDelete).toHaveBeenCalledWith(
        { fiscalBookId: 'fb1' },
        { session }
      );
      expect(result).toEqual({ fiscalBookId: 'fb1' });
    });
  });

  // ===== findDueSchedules =====
  describe('findDueSchedules', () => {
    test('returns due schedules', async () => {
      const query = makeExecQuery([{ fiscalBookId: 'fb1' }]);
      SnapshotScheduleModel.find.mockReturnValue(query);

      const date = new Date();
      const result = await findDueSchedules(date);

      expect(SnapshotScheduleModel.find).toHaveBeenCalledWith({
        enabled: true,
        nextExecutionAt: { $lte: date },
      });
      expect(result).toEqual([{ fiscalBookId: 'fb1' }]);
    });

    test('throws on error', async () => {
      SnapshotScheduleModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(findDueSchedules(new Date())).rejects.toThrow('Failed to find due schedules.');
    });

    test('supports session', async () => {
      const query = makeExecQuery([{ fiscalBookId: 'fb1' }]);
      SnapshotScheduleModel.find.mockReturnValue(query);
      const session = { id: 's' };
      const date = new Date();

      const result = await findDueSchedules(date, session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toEqual([{ fiscalBookId: 'fb1' }]);
    });
  });

  // ===== updateScheduleExecution =====
  describe('updateScheduleExecution', () => {
    test('updates execution times', async () => {
      SnapshotScheduleModel.findByIdAndUpdate.mockResolvedValue({ id: 'sched1' });

      const lastExecuted = new Date();
      const nextExecution = new Date();
      const result = await updateScheduleExecution('sched1', lastExecuted, nextExecution);

      expect(SnapshotScheduleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'sched1',
        { lastExecutedAt: lastExecuted, nextExecutionAt: nextExecution },
        { new: true }
      );
      expect(result).toEqual({ id: 'sched1' });
    });

    test('throws on error', async () => {
      SnapshotScheduleModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

      await expect(updateScheduleExecution('sched1', new Date(), new Date())).rejects.toThrow('Failed to update schedule execution.');
    });

    test('supports session', async () => {
      SnapshotScheduleModel.findByIdAndUpdate.mockResolvedValue({ id: 'sched1' });
      const session = { id: 's' };
      const lastExecuted = new Date();
      const nextExecution = new Date();

      const result = await updateScheduleExecution('sched1', lastExecuted, nextExecution, session);

      expect(SnapshotScheduleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'sched1',
        { lastExecutedAt: lastExecuted, nextExecutionAt: nextExecution },
        { new: true, session }
      );
      expect(result).toEqual({ id: 'sched1' });
    });
  });

  // ===== findSnapshotsToCleanup =====
  describe('findSnapshotsToCleanup', () => {
    test('returns snapshot IDs to delete', async () => {
      const query = makeQuery([{ _id: 'snap1' }, { _id: 'snap2' }]);
      FiscalBookSnapshotModel.find.mockReturnValue(query);

      const result = await findSnapshotsToCleanup('fb1', 5);

      expect(FiscalBookSnapshotModel.find).toHaveBeenCalledWith({
        originalFiscalBookId: 'fb1',
        creationSource: 'scheduled',
        isProtected: false,
      });
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(result).toEqual(['snap1', 'snap2']);
    });

    test('throws on error', async () => {
      FiscalBookSnapshotModel.find.mockImplementation(() => {
        throw new Error('db');
      });

      await expect(findSnapshotsToCleanup('fb1', 5)).rejects.toThrow('Failed to find snapshots for cleanup.');
    });

    test('supports session', async () => {
      const query = makeQuery([{ _id: 'snap1' }]);
      FiscalBookSnapshotModel.find.mockReturnValue(query);
      const session = { id: 's' };

      const result = await findSnapshotsToCleanup('fb1', 5, session);

      expect(query.session).toHaveBeenCalledWith(session);
      expect(result).toEqual(['snap1']);
    });
  });
});
