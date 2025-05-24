// Mock for API routes in client tests
module.exports = {
  POST: jest.fn(),
  GET: jest.fn(), 
  PUT: jest.fn(),
  DELETE: jest.fn(),
  PATCH: jest.fn(),
};