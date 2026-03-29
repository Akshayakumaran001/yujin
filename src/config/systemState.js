/**
 * System State — in-memory singleton for kill switch and metrics.
 * Used by worker and system controller.
 */
const state = {
  isPaused: false,
  workerRunning: false,
  whatsappConnected: false,

  // Real-time metrics
  metrics: {
    sentToday: 0,
    failedToday: 0,
    queueSize: 0,
    lastReset: new Date().toDateString(),
  },

  resetDailyMetrics() {
    const today = new Date().toDateString();
    if (this.metrics.lastReset !== today) {
      this.metrics.sentToday = 0;
      this.metrics.failedToday = 0;
      this.metrics.lastReset = today;
    }
  },

  getStatus() {
    this.resetDailyMetrics();
    return {
      isPaused: this.isPaused,
      workerRunning: this.workerRunning,
      whatsappConnected: this.whatsappConnected,
      metrics: { ...this.metrics },
    };
  },
};

module.exports = state;
