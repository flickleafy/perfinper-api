import { jest } from '@jest/globals';

const snapshotRepository = {
  getSchedule: jest.fn(),
  upsertSchedule: jest.fn(),
  getFiscalBook: jest.fn(),
  findDueSchedules: jest.fn(),
  updateScheduleExecution: jest.fn(),
  findSnapshotsToCleanup: jest.fn(),
  deleteSnapshot: jest.fn(),
};

const snapshotService = {
  createFiscalBookSnapshot: jest.fn(),
};

jest.unstable_mockModule('../repository/snapshotRepository.js', () => snapshotRepository);
jest.unstable_mockModule('./snapshotService.js', () => snapshotService);

const schedulerService = await import('./snapshotSchedulerService.js');
const {
  getSchedule,
  updateSchedule,
  disableSchedule,
  executeScheduledSnapshots,
  cleanupOldSnapshots,
  createBeforeStatusChangeSnapshot,
} = schedulerService;

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('snapshotSchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  // ===== getSchedule =====
  describe('getSchedule', () => {
    test('returns schedule for fiscal book', async () => {
      snapshotRepository.getSchedule.mockResolvedValue({ fiscalBookId: 'fb1', enabled: true });

      const result = await getSchedule('fb1');

      expect(snapshotRepository.getSchedule).toHaveBeenCalledWith('fb1');
      expect(result).toEqual({ fiscalBookId: 'fb1', enabled: true });
    });

    test('throws on error', async () => {
      snapshotRepository.getSchedule.mockRejectedValue(new Error('db'));

      await expect(getSchedule('fb1')).rejects.toThrow();
    });
  });

  // ===== updateSchedule =====
  describe('updateSchedule', () => {
    test('creates or updates schedule', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1', bookName: 'Test' });
      snapshotRepository.upsertSchedule.mockResolvedValue({ fiscalBookId: 'fb1', enabled: true });

      const result = await updateSchedule('fb1', {
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 1,
        retentionCount: 10,
      });

      expect(snapshotRepository.getFiscalBook).toHaveBeenCalledWith('fb1');
      expect(snapshotRepository.upsertSchedule).toHaveBeenCalledWith(
        'fb1',
        expect.objectContaining({
          enabled: true,
          frequency: 'weekly',
          dayOfWeek: 1,
          retentionCount: 10,
        })
      );
      expect(result).toEqual({ fiscalBookId: 'fb1', enabled: true });
    });

    test('throws when fiscal book not found', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue(null);

      await expect(updateSchedule('fb1', { enabled: true })).rejects.toThrow('Fiscal book not found.');
    });

    test('calculates next execution for weekly schedule', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1' });
      snapshotRepository.upsertSchedule.mockResolvedValue({});

      await updateSchedule('fb1', {
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 3, // Wednesday
      });

      expect(snapshotRepository.upsertSchedule).toHaveBeenCalledWith(
        'fb1',
        expect.objectContaining({
          nextExecutionAt: expect.any(Date),
        })
      );
    });

    test('calculates next execution for monthly schedule', async () => {
      snapshotRepository.getFiscalBook.mockResolvedValue({ _id: 'fb1' });
      snapshotRepository.upsertSchedule.mockResolvedValue({});

      await updateSchedule('fb1', {
        enabled: true,
        frequency: 'monthly',
        dayOfMonth: 15,
      });

      expect(snapshotRepository.upsertSchedule).toHaveBeenCalledWith(
        'fb1',
        expect.objectContaining({
          nextExecutionAt: expect.any(Date),
        })
      );
    });
  });

  // ===== disableSchedule =====
  describe('disableSchedule', () => {
    test('disables schedule', async () => {
      snapshotRepository.upsertSchedule.mockResolvedValue({ enabled: false });

      const result = await disableSchedule('fb1');

      expect(snapshotRepository.upsertSchedule).toHaveBeenCalledWith('fb1', { enabled: false });
      expect(result.enabled).toBe(false);
    });
  });

  // ===== executeScheduledSnapshots =====
  describe('executeScheduledSnapshots', () => {
    test('executes due schedules', async () => {
      const mockSchedules = [
        {
          _id: 'sched1',
          fiscalBookId: 'fb1',
          frequency: 'monthly',
          dayOfMonth: 15,
          autoTags: ['auto'],
          retentionCount: 5,
        },
      ];
      snapshotRepository.findDueSchedules.mockResolvedValue(mockSchedules);
      snapshotService.createFiscalBookSnapshot.mockResolvedValue({ _id: 'snap1' });
      snapshotRepository.updateScheduleExecution.mockResolvedValue({});
      snapshotRepository.findSnapshotsToCleanup.mockResolvedValue([]);

      const result = await executeScheduledSnapshots();

      expect(snapshotRepository.findDueSchedules).toHaveBeenCalled();
      expect(snapshotService.createFiscalBookSnapshot).toHaveBeenCalledWith(
        'fb1',
        expect.objectContaining({
          creationSource: 'scheduled',
          tags: ['auto'],
        })
      );
      expect(result.executed).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    test('handles errors for individual schedules', async () => {
      snapshotRepository.findDueSchedules.mockResolvedValue([
        { _id: 'sched1', fiscalBookId: 'fb1', autoTags: [] },
      ]);
      snapshotService.createFiscalBookSnapshot.mockRejectedValue(new Error('Create failed'));

      const result = await executeScheduledSnapshots();

      expect(result.executed).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fiscalBookId).toBe('fb1');
    });

    test('returns empty when no due schedules', async () => {
      snapshotRepository.findDueSchedules.mockResolvedValue([]);

      const result = await executeScheduledSnapshots();

      expect(result.executed).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ===== cleanupOldSnapshots =====
  describe('cleanupOldSnapshots', () => {
    test('deletes old snapshots beyond retention', async () => {
      snapshotRepository.findSnapshotsToCleanup.mockResolvedValue(['snap1', 'snap2']);
      snapshotRepository.deleteSnapshot.mockResolvedValue({});

      const result = await cleanupOldSnapshots('fb1', 5);

      expect(snapshotRepository.findSnapshotsToCleanup).toHaveBeenCalledWith('fb1', 5);
      expect(snapshotRepository.deleteSnapshot).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    test('skips protected snapshots', async () => {
      snapshotRepository.findSnapshotsToCleanup.mockResolvedValue(['snap1', 'snap2']);
      snapshotRepository.deleteSnapshot
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Cannot delete protected'));

      const result = await cleanupOldSnapshots('fb1', 5);

      expect(result).toBe(1);
    });

    test('uses default retention count', async () => {
      snapshotRepository.findSnapshotsToCleanup.mockResolvedValue([]);

      await cleanupOldSnapshots('fb1');

      expect(snapshotRepository.findSnapshotsToCleanup).toHaveBeenCalledWith('fb1', 12);
    });
  });

  // ===== createBeforeStatusChangeSnapshot =====
  describe('createBeforeStatusChangeSnapshot', () => {
    test('creates snapshot when schedule exists with before-status-change frequency', async () => {
      snapshotRepository.getSchedule.mockResolvedValue({
        _id: 'sched1',
        enabled: true,
        frequency: 'before-status-change',
        autoTags: ['auto', 'status-change'],
        retentionCount: 10,
      });
      snapshotService.createFiscalBookSnapshot.mockResolvedValue({ _id: 'snap1' });
      snapshotRepository.updateScheduleExecution.mockResolvedValue({});
      snapshotRepository.findSnapshotsToCleanup.mockResolvedValue([]);

      const result = await createBeforeStatusChangeSnapshot('fb1', 'Fechado');

      expect(snapshotService.createFiscalBookSnapshot).toHaveBeenCalledWith(
        'fb1',
        expect.objectContaining({
          creationSource: 'before-status-change',
          tags: expect.arrayContaining(['auto', 'status-change', 'before-status-change']),
        })
      );
      expect(result).toEqual({ _id: 'snap1' });
    });

    test('returns null when no schedule', async () => {
      snapshotRepository.getSchedule.mockResolvedValue(null);

      const result = await createBeforeStatusChangeSnapshot('fb1', 'Fechado');

      expect(result).toBeNull();
      expect(snapshotService.createFiscalBookSnapshot).not.toHaveBeenCalled();
    });

    test('returns null when schedule disabled', async () => {
      snapshotRepository.getSchedule.mockResolvedValue({
        enabled: false,
        frequency: 'before-status-change',
      });

      const result = await createBeforeStatusChangeSnapshot('fb1', 'Fechado');

      expect(result).toBeNull();
    });

    test('returns null when frequency is not before-status-change', async () => {
      snapshotRepository.getSchedule.mockResolvedValue({
        enabled: true,
        frequency: 'monthly',
      });

      const result = await createBeforeStatusChangeSnapshot('fb1', 'Fechado');

      expect(result).toBeNull();
    });

    test('handles errors gracefully', async () => {
      snapshotRepository.getSchedule.mockResolvedValue({
        _id: 'sched1',
        enabled: true,
        frequency: 'before-status-change',
        autoTags: [],
      });
      snapshotService.createFiscalBookSnapshot.mockRejectedValue(new Error('Create failed'));

      const result = await createBeforeStatusChangeSnapshot('fb1', 'Fechado');

      // Should not throw, status change should still proceed
      expect(result).toBeNull();
    });
  });
});
