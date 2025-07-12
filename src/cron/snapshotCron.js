import cron from 'node-cron';
import * as snapshotSchedulerService from '../services/snapshotSchedulerService.js';

/**
 * Cron job to execute scheduled snapshots
 * Runs every hour at minute 0
 */
export function initSnapshotCronJobs() {
  // Execute scheduled snapshots every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Executing scheduled snapshots check...');
    try {
      const result = await snapshotSchedulerService.executeScheduledSnapshots();
      console.log(`[Cron] Scheduled snapshots: ${result.executed.length} executed, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(err => {
          console.error(`[Cron] Error for fiscal book ${err.fiscalBookId}:`, err.error);
        });
      }
    } catch (error) {
      console.error('[Cron] Failed to execute scheduled snapshots:', error);
    }
  });

  console.log('[Cron] Snapshot scheduler initialized - runs hourly');
}

/**
 * Manual trigger endpoint handler for scheduled snapshots
 * Can be called from external scheduler or admin panel
 */
export async function triggerScheduledSnapshots() {
  try {
    const result = await snapshotSchedulerService.executeScheduledSnapshots();
    return {
      success: true,
      executed: result.executed.length,
      errors: result.errors.length,
      details: result,
    };
  } catch (error) {
    console.error('Error triggering scheduled snapshots:', error);
    throw error;
  }
}
