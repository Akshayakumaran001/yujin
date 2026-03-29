/**
 * Simple In-Memory Message Queue
 * FIFO — can be swapped for BullMQ in Phase 2+ upgrade.
 */
const logger = require('../services/logger.service');
const systemState = require('../config/systemState');

const _queue = [];

function addJob(job) {
  _queue.push(job);
  systemState.metrics.queueSize = _queue.length;
  logger.info('Job added to queue', { jobId: job.jobId, phone: job.phone, queueSize: _queue.length });
}

function getNextJob() {
  const job = _queue.shift();
  systemState.metrics.queueSize = _queue.length;
  return job || null;
}

function peekJob() {
  return _queue[0] || null;
}

function isEmpty() {
  return _queue.length === 0;
}

function size() {
  return _queue.length;
}

function clear() {
  _queue.length = 0;
  systemState.metrics.queueSize = 0;
}

module.exports = { addJob, getNextJob, peekJob, isEmpty, size, clear };
