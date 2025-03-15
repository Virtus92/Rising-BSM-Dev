const { 
  createMockRequest, 
  createMockResponse, 
  generateFixtures,
  datesAreEqual 
} = require('./test-helpers');

describe('Test Helpers', () => {
  describe('createMockRequest', () => {
    test('should create default mock request', () => {
      const req = createMockRequest();
      expect(req.method).toBe('GET');
      expect(req.url).toBe('/');
      expect(req.params).toEqual({});
      expect(req.body).toEqual({});
      expect(req.session).toEqual({});
      expect(req.flash).toBeInstanceOf(Function);
    });
    
    test('should override defaults with provided options', () => {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/users',
        body: { name: 'test' },
        user: { id: 1, name: 'User' }
      });
      
      expect(req.method).toBe('POST');
      expect(req.url).toBe('/api/users');
      expect(req.body).toEqual({ name: 'test' });
      expect(req.session.user).toEqual({ id: 1, name: 'User' });
    });
  });
  
  describe('createMockResponse', () => {
    test('should create mock response with spy methods', () => {
      const res = createMockResponse();
      
      expect(res.status).toBeInstanceOf(Function);
      expect(res.json).toBeInstanceOf(Function);
      expect(res.render).toBeInstanceOf(Function);
      expect(res.redirect).toBeInstanceOf(Function);
    });
    
    test('status method should be chainable', () => {
      const res = createMockResponse();
      
      expect(res.status(200)).toBe(res);
    });
  });
  
  describe('generateFixtures', () => {
    test('should generate customer fixtures', () => {
      const customers = generateFixtures('customer', 3);
      
      expect(customers).toHaveLength(3);
      customers.forEach((customer, i) => {
        expect(customer).toHaveProperty('id', i + 1);
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('telefon');
      });
    });
    
    test('should generate project fixtures', () => {
      const projects = generateFixtures('project', 2);
      
      expect(projects).toHaveLength(2);
      projects.forEach((project, i) => {
        expect(project).toHaveProperty('id', i + 1);
        expect(project).toHaveProperty('titel');
        expect(project).toHaveProperty('kunde_id');
        expect(project).toHaveProperty('betrag');
        expect(project).toHaveProperty('status');
      });
    });
  });
  
  describe('datesAreEqual', () => {
    test('should compare dates ignoring milliseconds', () => {
      const date1 = new Date('2023-06-15T12:30:45.123Z');
      const date2 = new Date('2023-06-15T12:30:45.456Z');
      const date3 = new Date('2023-06-15T12:30:46.000Z');
      
      expect(datesAreEqual(date1, date2)).toBe(true);
      expect(datesAreEqual(date1, date3)).toBe(false);
    });
    
    test('should handle non-date inputs', () => {
      expect(datesAreEqual('not-a-date', new Date())).toBe(false);
      expect(datesAreEqual(new Date(), null)).toBe(false);
    });
  });
});
