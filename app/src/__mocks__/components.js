// Mock for React components in server tests
const React = require('react');

module.exports = {
  // Generic component mock
  __esModule: true,
  default: React.forwardRef((props, ref) => React.createElement('div', { ...props, ref })),
  
  // Common component mocks
  Button: React.forwardRef((props, ref) => React.createElement('button', { ...props, ref })),
  Input: React.forwardRef((props, ref) => React.createElement('input', { ...props, ref })),
  Card: React.forwardRef((props, ref) => React.createElement('div', { ...props, ref })),
  Modal: React.forwardRef((props, ref) => React.createElement('div', { ...props, ref })),
};