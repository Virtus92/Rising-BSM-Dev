interface CacheStats {
    totalItems: number;
    activeItems: number;
    expiredItems: number;
}
export declare const getOrExecute: <T>(key: string, fn: () => Promise<T>, ttl?: number) => Promise<T>;
export declare const set: <T>(key: string, data: T, ttl?: number) => void;
export declare const get: <T>(key: string) => T | null;
export declare const deleteCache: (key: string) => void;
export declare const clear: (prefix?: string) => void;
export declare const getStats: () => CacheStats;
export declare const cleanup: () => void;
export declare const startCleanupInterval: () => boolean;
export declare const stopCleanupInterval: () => boolean;
export declare const cache: {
    getOrExecute: <T>(key: string, fn: () => Promise<T>, ttl?: number) => Promise<T>;
    set: <T>(key: string, data: T, ttl?: number) => void;
    get: <T>(key: string) => T | null;
    delete: (key: string) => void;
    clear: (prefix?: string) => void;
    getStats: () => CacheStats;
    cleanup: () => void;
    startCleanupInterval: () => boolean;
    stopCleanupInterval: () => boolean;
};
export default cache;
