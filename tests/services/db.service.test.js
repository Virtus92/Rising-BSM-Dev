const dbService = require('../../services/db.service');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
    on: jest.fn()
  };

  return {
    Pool: jest.fn().mockReturnValue(mockPool)
  };
});

describe('Database Service', () => {
  const mockPool = require('pg').Pool.mock.results[0].value;
  const mockClient = mockPool.connect.mock.results[0]?.value;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    test('should execute a query with string and params', async () => {
      // Arrange
      const queryString = 'SELECT * FROM users WHERE id = $1';
      const params = [1];
      const mockResult = { rows: [{ id: 1, name: 'Test User' }] };
      
      mockClient.query.mockResolvedValue(mockResult);
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      const result = await dbService.query(queryString, params);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockPool.connect).toHaveBeenCalled();
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
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      const result = await dbService.query(queryObject);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith(queryObject);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should release client even when query fails', async () => {
      // Arrange
      const queryString = 'SELECT * FROM nonexistent_table';
      const error = new Error('Relation does not exist');
      
      mockClient.query.mockRejectedValue(error);
      mockPool.connect.mockResolvedValue(mockClient);

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
      mockPool.connect.mockResolvedValue(mockClient);

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
      mockPool.connect.mockResolvedValue(mockClient);

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
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.getById('users', 1);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
    });

    test('should return null when no row found', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await dbService.getById('users', 999);

      // Assert
      expect(result).toBeNull();
    });

    test('should use custom id column when provided', async () => {
      // Arrange
      const mockRow = { user_id: 1, name: 'Test' };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.getById('users', 1, 'user_id');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_id = $1',
        [1]
      );
    });
  });

  describe('insert', () => {
    test('should insert a row and return it', async () => {
      // Arrange
      const data = { name: 'Test User', email: 'test@example.com' };
      const mockRow = { id: 1, ...data };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.insert('users', data);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *'),
        ['Test User', 'test@example.com']
      );
    });

    test('should use custom returning clause when provided', async () => {
      // Arrange
      const data = { name: 'Test User', email: 'test@example.com' };
      const mockRow = { id: 1 };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.insert('users', data, 'id');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('RETURNING id'),
        expect.any(Array)
      );
    });
  });

  describe('update', () => {
    test('should update a row by id and return it', async () => {
      // Arrange
      const id = 1;
      const data = { name: 'Updated User', email: 'updated@example.com' };
      const mockRow = { id, ...data };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.update('users', id, data);

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *'),
        ['Updated User', 'updated@example.com', 1]
      );
    });

    test('should use custom id column and returning clause when provided', async () => {
      // Arrange
      const id = 'usr123';
      const data = { name: 'Updated User' };
      const mockRow = { user_id: id, ...data };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.update('users', id, data, 'user_id', 'user_id, name');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $2 RETURNING user_id, name'),
        expect.any(Array)
      );
    });

    test('should use custom id column when provided', async () => {
      // Arrange
      const data = { name: 'Updated User' };
      const mockRow = { user_id: 1, name: 'Updated User' };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await dbService.update('users', 1, data, 'user_id');

      // Assert
      expect(result).toEqual(mockRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = '),
        expect.any(Array)
      );
    });
    
    test('should handle empty data object', async () => {
      // Arrange
      const data = {};

      // Act & Assert
      await expect(dbService.update('users', 1, data)).rejects.toThrow('No data provided for update');
    });
    
    test('should return null when no row is updated', async () => {
      // Arrange
      const data = { name: 'Updated User' };
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await dbService.update('users', 999, data);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    test('should delete a row by id and return true when successful', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await dbService.delete('users', 1);

      // Assert
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [1]
      );
    });

    test('should return false when no row was deleted', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      // Act
      const result = await dbService.delete('users', 999);

      // Assert
      expect(result).toBe(false);
    });

    test('should use custom id column when provided', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await dbService.delete('users', 'usr123', 'user_id');

      // Assert
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
        ['usr123']
      );
    });
  });
});
