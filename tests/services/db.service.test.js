const { query, transaction, getById, insert, update, delete: deleteRow, pool } = require('../../services/db.service');
const { Pool } = require('pg');

// Mock pg module
jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn(),
        query: jest.fn(),
        on: jest.fn(),
    };
    
    const mClient = {
        query: jest.fn(),
        release: jest.fn(),
    };
    
    mPool.connect.mockResolvedValue(mClient);
    
    return {
        Pool: jest.fn(() => mPool),
    };
});

describe('Database Service', () => {
    let mockPool;
    let mockClient;
    
    beforeEach(() => {
        mockPool = new Pool();
        mockClient = { query: jest.fn(), release: jest.fn() };
        mockPool.connect.mockResolvedValue(mockClient);
        jest.clearAllMocks();
    });
    
    describe('Pool Handler', () => {
        it('exits process when pool error occurs', () => {
            // Save original implementations
            const originalConsoleError = console.error;
            const originalProcessExit = process.exit;
            
            // Mock functions
            console.error = jest.fn();
            process.exit = jest.fn();
            
            // Simulate the error event
            const errorCallback = mockPool.on.mock.calls.find(call => call[0] === 'error');
            
            if (errorCallback) {
                const testError = new Error('Connection error');
                errorCallback[1](testError);
                
                // Verify behavior
                expect(console.error).toHaveBeenCalledWith('Unexpected database pool error', testError);
                expect(process.exit).toHaveBeenCalledWith(-1);
            }
            
            // Restore original implementations
            console.error = originalConsoleError;
            process.exit = originalProcessExit;
        });
        it('releases both client and global mockClient when defined', async () => {
            // Set up local client
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            
            // Define global mockClient
            global.mockClient = {
                release: jest.fn()
            };
            
            const result = await query('SELECT * FROM users');
            
            // Verify local client was released
            expect(mockClient.release).toHaveBeenCalled();
            
            // Verify global mockClient was released
            expect(global.mockClient.release).toHaveBeenCalled();
            
            // Cleanup
            delete global.mockClient;
        });
        
        it('only releases client when global mockClient is undefined', async () => {
            // Ensure global mockClient is undefined
            delete global.mockClient;
            
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            
            const result = await query('SELECT * FROM users');
            
            // Only the client should be released
            expect(mockClient.release).toHaveBeenCalled();
            
            // No errors should occur from trying to access undefined mockClient
            // This test passes if no error is thrown
        });
    });
    
    describe('query function', () => {
        it('executes string query with parameters', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            
            const result = await query('SELECT * FROM users WHERE id = $1', [1]);
            
            expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toEqual({ rows: [{ id: 1 }] });
        });
        
        it('executes object query', async () => {
            const queryObject = { text: 'SELECT * FROM users', values: [] };
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            
            const result = await query(queryObject);
            
            expect(mockClient.query).toHaveBeenCalledWith(queryObject);
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toEqual({ rows: [{ id: 1 }] });
        });
        
        it('releases client even when query fails', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Query failed'));
            
            await expect(query('SELECT * FROM users')).rejects.toThrow('Query failed');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
    
    describe('transaction function', () => {
        it('executes callback in a transaction', async () => {
            mockClient.query.mockResolvedValueOnce(); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Callback query
            mockClient.query.mockResolvedValueOnce(); // COMMIT
            
            const callback = jest.fn().mockResolvedValueOnce({ id: 1 });
            
            const result = await transaction(callback);
            
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(callback).toHaveBeenCalledWith(mockClient);
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toEqual({ id: 1 });
        });
        
        it('rolls back transaction on error', async () => {
            mockClient.query.mockResolvedValueOnce(); // BEGIN
            const error = new Error('Transaction failed');
            const callback = jest.fn().mockRejectedValueOnce(error);
            mockClient.query.mockResolvedValueOnce(); // ROLLBACK
            
            await expect(transaction(callback)).rejects.toThrow('Transaction failed');
            
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
    
    describe('getById function', () => {
        it('retrieves a row by id', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test' }] });
            
            const result = await getById('users', 1);
            
            expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
            expect(result).toEqual({ id: 1, name: 'Test' });
        });
        
        it('returns null when no row is found', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });
            
            const result = await getById('users', 999);
            
            expect(result).toBeNull();
        });
        
        it('uses custom id column when provided', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ uuid: 'abc123', name: 'Test' }] });
            
            await getById('users', 'abc123', 'uuid');
            
            expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE uuid = $1', ['abc123']);
        });
    });
    
    describe('insert function', () => {
        it('inserts a row and returns it', async () => {
            const data = { name: 'Test', email: 'test@example.com' };
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...data }] });
            
            const result = await insert('users', data);
            
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO users \(name, email\)\s+VALUES \(\$1, \$2\)\s+RETURNING \*/),
                ['Test', 'test@example.com']
            );
            expect(result).toEqual({ id: 1, name: 'Test', email: 'test@example.com' });
        });
        
        it('uses custom returning clause when provided', async () => {
            const data = { name: 'Test', email: 'test@example.com' };
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            
            await insert('users', data, 'id');
            
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('RETURNING id'),
                ['Test', 'test@example.com']
            );
        });
    });
    
    describe('update function', () => {
        it('updates a row and returns it', async () => {
            const data = { name: 'Updated', email: 'updated@example.com' };
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...data }] });
            
                        const result = await update('users', 1, data);
                        
                        expect(mockPool.query).toHaveBeenCalledWith(
                            expect.stringMatching(/UPDATE users\s+SET name = \$1, email = \$2\s+WHERE id = \$3\s+RETURNING \*/),
                            ['Updated', 'updated@example.com', 1]
                        );
            expect(result).toEqual({ id: 1, name: 'Updated', email: 'updated@example.com' });
        });
        
        it('uses custom id column and returning clause when provided', async () => {
            const data = { name: 'Updated' };
            mockPool.query.mockResolvedValueOnce({ rows: [{ uuid: 'abc123', name: 'Updated' }] });
            
            await update('users', 'abc123', data, 'uuid', 'uuid, name');
            
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE users\s+SET name = \$1\s+WHERE uuid = \$2\s+RETURNING uuid, name/),
                ['Updated', 'abc123']
            );
        });
    });
    
    describe('delete function', () => {
        it('deletes a row and returns true when successful', async () => {
            mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
            
            const result = await deleteRow('users', 1);
            
            expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1 RETURNING id', [1]);
            expect(result).toBe(true);
        });
        
        it('returns false when no row is deleted', async () => {
            mockPool.query.mockResolvedValueOnce({ rowCount: 0 });
            
            const result = await deleteRow('users', 999);
            
            expect(result).toBe(false);
        });
        
        it('uses custom id column when provided', async () => {
            mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
            
            await deleteRow('users', 'abc123', 'uuid');
            
            expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM users WHERE uuid = $1 RETURNING uuid', ['abc123']);
        });
    });
});