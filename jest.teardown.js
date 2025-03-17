const cacheService = require('./services/cache.service');

module.exports = async () => {
  // Stop the cleanup interval
  cacheService.stopCleanupInterval();
  
  // Allow a small delay for any async operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Force cleanup of any timers
  if (global.gc) {
    global.gc();
  }
};
