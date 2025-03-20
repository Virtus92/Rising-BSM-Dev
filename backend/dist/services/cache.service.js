"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.stopCleanupInterval = exports.startCleanupInterval = exports.cleanup = exports.getStats = exports.clear = exports.deleteCache = exports.get = exports.set = exports.getOrExecute = void 0;
const cacheStore = {};
let cleanupIntervalId = null;
const getOrExecute = async (key, fn, ttl = 300) => {
    const now = Date.now();
    if (cacheStore[key] && cacheStore[key].expiry > now) {
        return cacheStore[key].data;
    }
    let data;
    try {
        data = await fn();
    }
    catch (error) {
        console.error(`Error executing cache callback for key "${key}":`, error);
        throw error;
    }
    cacheStore[key] = {
        data,
        expiry: now + (ttl * 1000)
    };
    return data;
};
exports.getOrExecute = getOrExecute;
const set = (key, data, ttl = 300) => {
    cacheStore[key] = {
        data,
        expiry: Date.now() + (ttl * 1000)
    };
};
exports.set = set;
const get = (key) => {
    const now = Date.now();
    if (cacheStore[key] && cacheStore[key].expiry > now) {
        return cacheStore[key].data;
    }
    return null;
};
exports.get = get;
const deleteCache = (key) => {
    delete cacheStore[key];
};
exports.deleteCache = deleteCache;
const clear = (prefix) => {
    if (prefix) {
        Object.keys(cacheStore).forEach(key => {
            if (key.startsWith(prefix)) {
                delete cacheStore[key];
            }
        });
    }
    else {
        Object.keys(cacheStore).forEach(key => {
            delete cacheStore[key];
        });
    }
};
exports.clear = clear;
const getStats = () => {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    Object.values(cacheStore).forEach(item => {
        totalItems++;
        if (item.expiry <= now) {
            expiredItems++;
        }
    });
    return {
        totalItems,
        activeItems: totalItems - expiredItems,
        expiredItems
    };
};
exports.getStats = getStats;
const cleanup = () => {
    const now = Date.now();
    Object.entries(cacheStore).forEach(([key, value]) => {
        if (value.expiry <= now) {
            delete cacheStore[key];
        }
    });
};
exports.cleanup = cleanup;
const startCleanupInterval = () => {
    if (!cleanupIntervalId) {
        cleanupIntervalId = setInterval(exports.cleanup, 5 * 60 * 1000);
        return true;
    }
    return false;
};
exports.startCleanupInterval = startCleanupInterval;
const stopCleanupInterval = () => {
    if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
        return true;
    }
    return false;
};
exports.stopCleanupInterval = stopCleanupInterval;
if (process.env.NODE_ENV !== 'test') {
    (0, exports.startCleanupInterval)();
}
exports.cache = {
    getOrExecute: exports.getOrExecute,
    set: exports.set,
    get: exports.get,
    delete: exports.deleteCache,
    clear: exports.clear,
    getStats: exports.getStats,
    cleanup: exports.cleanup,
    startCleanupInterval: exports.startCleanupInterval,
    stopCleanupInterval: exports.stopCleanupInterval
};
exports.default = exports.cache;
//# sourceMappingURL=cache.service.js.map