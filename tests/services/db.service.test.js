const { Pool } = require('pg');

// Mock the pg Pool
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  const mPool = {
    connect: jest.fn().mockResolvedValue(mClient),
    on: jest.fn(),
    end: jest.fn()
  };

  return { Pool: jest.fn(() => mPool) };
});

describe('Database Service', () => {
  let dbService;
  let pool;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module cache to get a fresh instance
    jest.resetModules();

    // Get the mocked instances
    pool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    pool.connect.mockResolvedValue(mockClient);
    dbService = require('../../services/db.service');
  });

  afterEach(() => {
    // Clean up
    if (dbService.pool) {
      dbService.pool.end();
    }
  });

  describe('query', () => {
    test('should execute a query with string and params', async () => {
      // Arrange
      const queryString = 'SELECT * FROM users WHERE id = $1';
      const params = [1];
      const mockResult = { rows: [{ id: 1, name: 'Test User' }] };
      
      mockClient.query.mockResolvedValue(mockResult);

      // Act
      const result = await dbService.query(queryString, params);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith(queryString, params);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should execute a query with object parameter', async () => {
      // Arrange
      const queryObject = { 
        text: 'SELECT * FROM users WHERE id = $1',
        values: [1]
      };
      const mockResult = { rows: [{ id: 1, name: 'Test User' }] };
      
      mockClient.query.mockResolvedValue(mockResult);

      // Act
      const result = await dbService.query(queryObject);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith(queryObject);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle query errors', async () => {
      // Arrange
      const queryString = 'SELECT * FROM nonexistent_table';
      const error = new Error('Relation does not exist');
      
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(dbService.query(queryString)).rejects.toThrow(error);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('transaction', () => {
    test('should execute callback in a transaction', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ success: true });
      mockClient.query.mockResolvedValue({});

      // Act
      const result = await dbService.transaction(mockCallback);

      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('should rollback transaction on error', async () => {
      // Arrange
      const error = new Error('Transaction error');
      const mockCallback = jest.fn().mockRejectedValue(error);
      mockClient.query.mockResolvedValue({});

      // Act & Assert
      await expect(dbService.transaction(mockCallback)).rejects.toThrow(error);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    test('should get a row by id', async () => {
      // Arrange
      const mockRow = { id: 1, name: 'Test' };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.getById('users', 1);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should return null when no row found', async () => {
      // Arrange
      mockClient.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await dbService.getById('users', 999);

      // Assert
      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should use custom id column when provided', async () => {
      // Arrange
      const mockRow = { user_id: 1, name: 'Test' };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.getById('users', 1, 'user_id');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_id = $1',
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('insert', () => {
    test('should insert a row and return it', async () => {
      // Arrange
      const data = { name: 'Test User', email: 'test@example.com' };
      const mockRow = { id: 1, ...data };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.insert('users', data);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO users \(name, email\) VALUES \(\$1, \$2\) RETURNING \*/),
        ['Test User', 'test@example.com']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should use custom returning clause when provided', async () => {
      // Arrange
      const data = { name: 'Test User', email: 'test@example.com' };
      const mockRow = { id: 1 };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.insert('users', data, 'id');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/RETURNING id/),
        expect.any(Array)
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    test('should update a row by id and return it', async () => {
      // Arrange
      const id = 1;
      const data = { name: 'Updated User', email: 'updated@example.com' };
      const mockRow = { id, ...data };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.update('users', id, data);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users SET name = \$1, email = \$2 WHERE id = \$3 RETURNING \*/),
        ['Updated User', 'updated@example.com', 1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should use custom id column and returning clause when provided', async () => {
      // Arrange
      const id = 'usr123';
      const data = { name: 'Updated User' };
      const mockRow = { user_id: id, ...data };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.update('users', id, data, 'user_id', 'user_id, name');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE user_id = \$2 RETURNING user_id, name/),
        expect.any(Array)
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should return null when no row is updated', async () => {
      // Arrange
      const id = 999;
      const data = { name: 'Updated User' };
      mockClient.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await dbService.update('users', id, data);

      // Assert
      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    test('should delete a row by id and return true when successful', async () => {
      // Arrange
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await dbService.delete('users', 1);

      // Assert
      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should return false when no row was deleted', async () => {
      // Arrange
      mockClient.query.mockResolvedValue({ rowCount: 0 });

      // Act
      const result = await dbService.delete('users', 999);

      // Assert
      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should use custom id column when provided', async () => {
      // Arrange
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await dbService.delete('users', 1, 'user_id');

      // Assert
      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
