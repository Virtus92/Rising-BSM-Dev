import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary, { ErrorFallback } from '../ErrorBoundary';

// Component that always throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="test-child">Test Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
  
  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Ein Fehler ist aufgetreten/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });
  
  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
  
  it('calls onError when error occurs', () => {
    const mockOnError = jest.fn();
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(mockOnError).toHaveBeenCalled();
  });
});

describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(<ErrorFallback error={new Error('Test fallback error')} />);
    
    expect(screen.getByText(/Etwas ist schiefgelaufen/i)).toBeInTheDocument();
    expect(screen.getByText(/Test fallback error/i)).toBeInTheDocument();
  });
  
  it('calls resetErrorBoundary when button is clicked', () => {
    const resetMock = jest.fn();
    
    render(<ErrorFallback error={new Error('Test error')} resetErrorBoundary={resetMock} />);
    screen.getByText(/Erneut versuchen/i).click();
    
    expect(resetMock).toHaveBeenCalled();
  });
});
