const pool = require('../db');

describe('Database Connection', () => {
  test('should connect to the database', async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    
    const result = await client.query('SELECT NOW()');
    expect(result.rows).toHaveLength(1);
    
    client.release();
  });

  test('should handle connection error event', () => {
    const originalConsoleError = console.error;
    const originalProcessExit = process.exit;
    
    // Mock console.error and process.exit
    console.error = jest.fn();
    process.exit = jest.fn();
    
    // Simulate error event
    pool.emit('error', new Error('Test error'));
    
    // Check if error was logged and process.exit was called
    expect(console.error).toHaveBeenCalledWith(
      'Unerwarteter Fehler bei der Datenbankverbindung',
      expect.any(Error)
    );
    expect(process.exit).toHaveBeenCalledWith(-1);
    
    // Restore original functions
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  afterAll(async () => {
    await pool.end();
  });
});