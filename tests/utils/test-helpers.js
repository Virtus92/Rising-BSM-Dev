/**
 * Test helper utilities to make writing tests easier
 */

/**
 * Creates a mock request object
 * @param {Object} options - Options to customize the request
 * @returns {Object} Mock request object
 */
function createMockRequest(options = {}) {
  const defaultOptions = {
    method: 'GET',
    url: '/',
    params: {},
    query: {},
    body: {},
    session: {},
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    xhr: false,
    flash: jest.fn()
  };
  
  // Merge with provided options
  const mockReq = { ...defaultOptions, ...options };
  
  // Add session user if specified
  if (options.user) {
    mockReq.session.user = options.user;
  }
  
  return mockReq;
}

/**
 * Creates a mock response object
 * @returns {Object} Mock response object with jest spy functions
 */
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    format: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    locals: {},
    headersSent: false,
    _headers: {},
    setHeader: jest.fn(),
    getHeader: jest.fn()
  };
  return res;
}

/**
 * Creates test fixtures with random data
 * @param {String} type - Type of fixture (customer, project, service)
 * @param {Number} count - Number of fixtures to create
 * @returns {Array} Array of generated fixtures
 */
function generateFixtures(type, count = 1) {
  const fixtures = [];
  
  for (let i = 0; i < count; i++) {
    const id = i + 1;
    
    switch (type) {
      case 'customer':
        fixtures.push({
          id,
          name: `Customer ${id}`,
          email: `customer${id}@example.com`,
          telefon: `123-456-${id.toString().padStart(4, '0')}`,
          firma: `Company ${id}`,
          adresse: `Street ${id}`,
          plz: '10115',
          ort: 'Berlin',
          status: id % 2 === 0 ? 'aktiv' : 'inaktiv',
          kundentyp: id % 3 === 0 ? 'geschaeft' : 'privat',
          created_at: new Date().toISOString()
        });
        break;
      
      case 'project':
        fixtures.push({
          id,
          titel: `Test Project ${id}`,
          kunde_id: id,
          dienstleistung_id: id,
          start_datum: new Date().toISOString(),
          end_datum: null,
          betrag: 1000 * id,
          beschreibung: `Test project ${id} description`,
          status: ['neu', 'in_bearbeitung', 'abgeschlossen'][id % 3],
          created_at: new Date().toISOString()
        });
        break;
        
      // Add more types as needed
    }
  }
  
  return fixtures;
}

/**
 * Compare date objects regardless of millisecond precision
 * @param {Date} date1 - First date to compare
 * @param {Date} date2 - Second date to compare
 * @returns {Boolean} Whether dates are equivalent
 */
function datesAreEqual(date1, date2) {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }
  
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate() &&
         date1.getHours() === date2.getHours() &&
         date1.getMinutes() === date2.getMinutes() &&
         date1.getSeconds() === date2.getSeconds();
}

module.exports = {
  createMockRequest,
  createMockResponse,
  generateFixtures,
  datesAreEqual
};
