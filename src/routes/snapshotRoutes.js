import express from 'express';
import * as snapshotService from '../services/snapshotService.js';
import * as snapshotSchedulerService from '../services/snapshotSchedulerService.js';

const router = express.Router();

// ===== Fiscal Book Scoped Routes =====

/**
 * Create a new snapshot for a fiscal book
 * POST /api/fiscal-book/:fiscalBookId/snapshots
 */
router.post('/fiscal-book/:fiscalBookId/snapshots', async (req, res) => {
  try {
    const { fiscalBookId } = req.params;
    const { name, description, tags } = req.body;

    const snapshot = await snapshotService.createFiscalBookSnapshot(fiscalBookId, {
      name,
      description,
      tags,
    });

    res.status(201).json({
      success: true,
      message: 'Snapshot created successfully',
      data: snapshot,
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create snapshot',
    });
  }
});

/**
 * Get all snapshots for a fiscal book
 * GET /api/fiscal-book/:fiscalBookId/snapshots
 * Query params: tags (comma-separated), limit, skip
 */
router.get('/fiscal-book/:fiscalBookId/snapshots', async (req, res) => {
  try {
    const { fiscalBookId } = req.params;
    const { tags, limit, skip } = req.query;

    const filters = {
      limit: limit ? parseInt(limit, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
    };

    const result = await snapshotService.getSnapshotsForFiscalBook(fiscalBookId, filters);

    res.json({
      success: true,
      data: result.snapshots,
      pagination: {
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      },
    });
  } catch (error) {
    console.error('Error getting snapshots:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get snapshots',
    });
  }
});

/**
 * Get snapshot schedule for a fiscal book
 * GET /api/fiscal-book/:fiscalBookId/snapshots/schedule
 */
router.get('/fiscal-book/:fiscalBookId/snapshots/schedule', async (req, res) => {
  try {
    const { fiscalBookId } = req.params;
    const schedule = await snapshotSchedulerService.getSchedule(fiscalBookId);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get schedule',
    });
  }
});

/**
 * Update snapshot schedule for a fiscal book
 * PUT /api/fiscal-book/:fiscalBookId/snapshots/schedule
 */
router.put('/fiscal-book/:fiscalBookId/snapshots/schedule', async (req, res) => {
  try {
    const { fiscalBookId } = req.params;
    const scheduleConfig = req.body;

    const schedule = await snapshotSchedulerService.updateSchedule(fiscalBookId, scheduleConfig);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update schedule',
    });
  }
});

// ===== Snapshot Scoped Routes =====

/**
 * Get snapshot details
 * GET /api/snapshots/:snapshotId
 */
router.get('/snapshots/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const snapshot = await snapshotService.getSnapshotDetails(snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found',
      });
    }

    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error getting snapshot details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get snapshot details',
    });
  }
});

/**
 * Delete a snapshot
 * DELETE /api/snapshots/:snapshotId
 */
router.delete('/snapshots/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const deletedSnapshot = await snapshotService.deleteSnapshot(snapshotId);

    if (!deletedSnapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found',
      });
    }

    res.json({
      success: true,
      message: 'Snapshot deleted successfully',
      data: deletedSnapshot,
    });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    const statusCode = error.message.includes('protected') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete snapshot',
    });
  }
});

/**
 * Get snapshot transactions
 * GET /api/snapshots/:snapshotId/transactions
 * Query params: limit, skip
 */
router.get('/snapshots/:snapshotId/transactions', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { limit, skip } = req.query;

    const result = await snapshotService.getSnapshotTransactions(snapshotId, {
      limit: limit ? parseInt(limit, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      },
    });
  } catch (error) {
    console.error('Error getting snapshot transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get snapshot transactions',
    });
  }
});

/**
 * Compare snapshot with current fiscal book state
 * GET /api/snapshots/:snapshotId/compare
 */
router.get('/snapshots/:snapshotId/compare', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const comparison = await snapshotService.compareSnapshotWithCurrent(snapshotId);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error comparing snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to compare snapshot',
    });
  }
});

/**
 * Update snapshot tags
 * PUT /api/snapshots/:snapshotId/tags
 */
router.put('/snapshots/:snapshotId/tags', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array',
      });
    }

    const updatedSnapshot = await snapshotService.updateTags(snapshotId, tags);

    if (!updatedSnapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found',
      });
    }

    res.json({
      success: true,
      message: 'Tags updated successfully',
      data: updatedSnapshot,
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tags',
    });
  }
});

/**
 * Toggle snapshot protection
 * PUT /api/snapshots/:snapshotId/protection
 */
router.put('/snapshots/:snapshotId/protection', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { isProtected } = req.body;

    if (typeof isProtected !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isProtected must be a boolean',
      });
    }

    const updatedSnapshot = await snapshotService.toggleProtection(snapshotId, isProtected);

    if (!updatedSnapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found',
      });
    }

    res.json({
      success: true,
      message: `Snapshot ${isProtected ? 'protected' : 'unprotected'} successfully`,
      data: updatedSnapshot,
    });
  } catch (error) {
    console.error('Error toggling protection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle protection',
    });
  }
});

/**
 * Add annotation to snapshot
 * POST /api/snapshots/:snapshotId/annotations
 */
router.post('/snapshots/:snapshotId/annotations', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { content, createdBy } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Annotation content is required',
      });
    }

    const updatedSnapshot = await snapshotService.addAnnotation(snapshotId, content, createdBy);

    if (!updatedSnapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Annotation added successfully',
      data: updatedSnapshot,
    });
  } catch (error) {
    console.error('Error adding annotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add annotation',
    });
  }
});

/**
 * Add annotation to snapshot transaction
 * POST /api/snapshots/:snapshotId/transactions/:transactionId/annotations
 */
router.post('/snapshots/:snapshotId/transactions/:transactionId/annotations', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { content, createdBy } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Annotation content is required',
      });
    }

    const updatedTransaction = await snapshotService.addTransactionAnnotation(
      transactionId,
      content,
      createdBy
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot transaction not found',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Annotation added successfully',
      data: updatedTransaction,
    });
  } catch (error) {
    console.error('Error adding transaction annotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add annotation',
    });
  }
});

/**
 * Export snapshot
 * GET /api/snapshots/:snapshotId/export
 * Query params: format (csv, json, pdf)
 */
router.get('/snapshots/:snapshotId/export', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { format } = req.query;

    const exportResult = await snapshotService.exportSnapshot(snapshotId, format || 'json');

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.fileName}"`);
    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export snapshot',
    });
  }
});

/**
 * Clone snapshot to new fiscal book
 * POST /api/snapshots/:snapshotId/clone
 */
router.post('/snapshots/:snapshotId/clone', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const newBookData = req.body;

    const newFiscalBook = await snapshotService.cloneToNewFiscalBook(snapshotId, newBookData);

    res.status(201).json({
      success: true,
      message: 'Fiscal book created from snapshot successfully',
      data: newFiscalBook,
    });
  } catch (error) {
    console.error('Error cloning snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clone snapshot',
    });
  }
});

/**
 * Rollback fiscal book to snapshot state
 * POST /api/snapshots/:snapshotId/rollback
 */
router.post('/snapshots/:snapshotId/rollback', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { createPreRollbackSnapshot } = req.body;

    const result = await snapshotService.rollbackToSnapshot(snapshotId, {
      createPreRollbackSnapshot: createPreRollbackSnapshot !== false,
    });

    res.json({
      success: true,
      message: 'Rollback completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error rolling back to snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to rollback to snapshot',
    });
  }
});

export default router;
