// Mock for next/server module in tests
module.exports = {
  NextRequest: class NextRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = options.headers || {};
      this.body = options.body;
    }
    
    async json() {
      return this.body ? JSON.parse(this.body) : null;
    }
  },
  
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
    redirect: jest.fn(),
    next: jest.fn(),
  },
};