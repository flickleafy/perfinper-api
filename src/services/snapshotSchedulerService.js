import * as snapshotRepository from '../repository/snapshotRepository.js';
import * as snapshotService from './snapshotService.js';

/**
 * Get snapshot schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @returns {Promise<Object|null>} Schedule configuration or null
 */
export async function getSchedule(fiscalBookId) {
  try {
    return await snapshotRepository.getSchedule(fiscalBookId);
  } catch (error) {
    console.error('Error getting schedule:', error.message);
    throw error;
  }
}

/**
 * Create or update snapshot schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} scheduleConfig - Schedule configuration
 * @param {boolean} scheduleConfig.enabled - Enable/disable scheduling
 * @param {string} scheduleConfig.frequency - 'weekly', 'monthly', or 'before-status-change'
 * @param {number} scheduleConfig.dayOfWeek - Day of week (0-6) for weekly
 * @param {number} scheduleConfig.dayOfMonth - Day of month (1-31) for monthly
 * @param {number} scheduleConfig.retentionCount - Max snapshots to keep
 * @param {Array<string>} scheduleConfig.autoTags - Tags to apply to auto-snapshots
 * @returns {Promise<Object>} Updated schedule
 */
export async function updateSchedule(fiscalBookId, scheduleConfig) {
  try {
    // Validate fiscal book exists
    const fiscalBook = await snapshotRepository.getFiscalBook(fiscalBookId);
    if (!fiscalBook) {
      throw new Error('Fiscal book not found.');
    }

    // Calculate next execution time
    const nextExecutionAt = calculateNextExecution(scheduleConfig);

    const schedule = await snapshotRepository.upsertSchedule(fiscalBookId, {
      enabled: scheduleConfig.enabled,
      frequency: scheduleConfig.frequency,
      dayOfWeek: scheduleConfig.dayOfWeek,
      dayOfMonth: scheduleConfig.dayOfMonth,
      retentionCount: scheduleConfig.retentionCount || 12,
      autoTags: scheduleConfig.autoTags || ['auto'],
      nextExecutionAt,
    });

    return schedule;
  } catch (error) {
    console.error('Error updating schedule:', error.message);
    throw error;
  }
}

/**
 * Disable snapshot schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @returns {Promise<Object|null>} Updated schedule or null
 */
export async function disableSchedule(fiscalBookId) {
  try {
    return await snapshotRepository.upsertSchedule(fiscalBookId, {
      enabled: false,
    });
  } catch (error) {
    console.error('Error disabling schedule:', error.message);
    throw error;
  }
}

/**
 * Calculate next execution time based on schedule configuration
 * @private
 * @param {Object} config - Schedule configuration
 * @returns {Date} Next execution date
 */
function calculateNextExecution(config) {
  const now = new Date();

  if (config.frequency === 'weekly') {
    const daysUntilTarget = (config.dayOfWeek - now.getDay() + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilTarget);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }

  if (config.frequency === 'monthly') {
    const targetDay = config.dayOfMonth || 1;
    const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);

    // If target day has passed this month, move to next month
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }

  // For 'before-status-change', no scheduled execution
  return null;
}

/**
 * Execute all scheduled snapshots that are due
 * This should be called by a cron job
 * @returns {Promise<Object>} Execution result
 */
export async function executeScheduledSnapshots() {
  const now = new Date();
  const results = {
    executed: [],
    errors: [],
  };

  try {
    // Find all schedules that are due
    const dueSchedules = await snapshotRepository.findDueSchedules(now);

    for (const schedule of dueSchedules) {
      try {
        // Create the snapshot
        const snapshot = await snapshotService.createFiscalBookSnapshot(
          schedule.fiscalBookId,
          {
            name: `Snapshot Automático ${now.toISOString().split('T')[0]}`,
            description: `Snapshot automático criado por agendamento ${schedule.frequency}`,
            tags: schedule.autoTags || ['auto'],
            creationSource: 'scheduled',
          }
        );

        // Calculate next execution
        const nextExecutionAt = calculateNextExecution(schedule);

        // Update schedule execution times
        await snapshotRepository.updateScheduleExecution(
          schedule._id,
          now,
          nextExecutionAt
        );

        // Clean up old snapshots beyond retention limit
        await cleanupOldSnapshots(schedule.fiscalBookId, schedule.retentionCount);

        results.executed.push({
          fiscalBookId: schedule.fiscalBookId,
          snapshotId: snapshot._id,
          nextExecutionAt,
        });
      } catch (error) {
        console.error(`Error executing schedule for fiscal book ${schedule.fiscalBookId}:`, error.message);
        results.errors.push({
          fiscalBookId: schedule.fiscalBookId,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error executing scheduled snapshots:', error.message);
    throw error;
  }
}

/**
 * Clean up old snapshots beyond retention limit
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {number} retentionCount - Number of scheduled snapshots to keep
 * @returns {Promise<number>} Number of deleted snapshots
 */
export async function cleanupOldSnapshots(fiscalBookId, retentionCount = 12) {
  try {
    const snapshotsToDelete = await snapshotRepository.findSnapshotsToCleanup(
      fiscalBookId,
      retentionCount
    );

    let deletedCount = 0;
    for (const snapshotId of snapshotsToDelete) {
      try {
        await snapshotRepository.deleteSnapshot(snapshotId);
        deletedCount++;
      } catch (error) {
        // Skip protected snapshots or other errors
        console.warn(`Could not delete snapshot ${snapshotId}:`, error.message);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old snapshots:', error.message);
    throw error;
  }
}

/**
 * Create a snapshot before status change (for 'before-status-change' schedules)
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {string} newStatus - The new status
 * @returns {Promise<Object|null>} Created snapshot or null
 */
export async function createBeforeStatusChangeSnapshot(fiscalBookId, newStatus) {
  try {
    // Check if there's a schedule with 'before-status-change' frequency
    const schedule = await snapshotRepository.getSchedule(fiscalBookId);

    if (!schedule || !schedule.enabled || schedule.frequency !== 'before-status-change') {
      return null;
    }

    // Create the snapshot
    const snapshot = await snapshotService.createFiscalBookSnapshot(fiscalBookId, {
      name: `Antes de ${newStatus} - ${new Date().toISOString().split('T')[0]}`,
      description: `Snapshot automático criado antes da mudança de status para ${newStatus}`,
      tags: [...(schedule.autoTags || ['auto']), 'before-status-change'],
      creationSource: 'before-status-change',
    });

    // Update last executed
    await snapshotRepository.updateScheduleExecution(
      schedule._id,
      new Date(),
      null // No next execution for event-based
    );

    // Clean up old snapshots
    await cleanupOldSnapshots(fiscalBookId, schedule.retentionCount);

    return snapshot;
  } catch (error) {
    console.error('Error creating before-status-change snapshot:', error.message);
    // Don't throw - status change should still proceed
    return null;
  }
}
