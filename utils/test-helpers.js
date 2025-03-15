exports.createMockRequest = (options = {}) => {
  const req = Object.assign({
    body: {},
    params: {},
    query: {},
    session: { user: { id: 1, name: 'Test User', role: 'admin' } },
    headers: {},
    flash: jest.fn().mockReturnValue([]),
    csrfToken: jest.fn().mockReturnValue('test-csrf-token'),
    ip: '127.0.0.1'
  }, options);
  
  return req;
};

exports.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
};
