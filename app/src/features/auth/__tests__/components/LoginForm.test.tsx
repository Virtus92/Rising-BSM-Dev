import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginForm from '../../components/LoginForm';

// Mock the AuthProvider hook
const mockLogin = jest.fn();
const mockUseAuth = jest.fn(() => ({
  login: mockLogin,
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: true,
}));

jest.mock('../../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

// Mock UI components to avoid complex rendering issues
jest.mock('@/shared/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, className, ...props }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/shared/components/ui/input', () => ({
  Input: ({ value, onChange, disabled, type, id, placeholder, className, required }: any) => (
    <input
      id={id}
      type={type}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      required={required}
      data-testid={`input-${id}`}
    />
  ),
}));

jest.mock('@/shared/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid={`label-${htmlFor}`}>
      {children}
    </label>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  AlertCircle: ({ className }: any) => (
    <div className={className} data-testid="alert-circle-icon">
      ⚠️
    </div>
  ),
}));

// Mock the AuthService core
jest.mock('@/features/auth/core', () => {
  const signInMock = jest.fn();
  
  const mockAuthServiceInstance = {
    signIn: signInMock,
    getInstance: jest.fn(),
    initialize: jest.fn(),
    isInitialized: true,
    getAuthState: jest.fn(() => ({
      isAuthenticated: false,
      isInitialized: true,
      user: null,
      initializationTime: Date.now(),
    })),
    onAuthStateChange: jest.fn(() => jest.fn()), // Returns unsubscribe function
  };
  
  // Fix circular reference
  mockAuthServiceInstance.getInstance.mockReturnValue(mockAuthServiceInstance);
  
  return {
    __esModule: true,
    default: mockAuthServiceInstance,
  };
});

// Import the mocked module to get access to the mocked methods
import AuthService from '@/features/auth/core';

describe('LoginForm', () => {
  const mockSignIn = AuthService.signIn as jest.MockedFunction<typeof AuthService.signIn>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockLogin.mockReset();
    mockSignIn.mockReset();
    mockToast.mockReset();
    mockPush.mockReset();
    
    // Set up default successful mock behaviors
    mockLogin.mockResolvedValue({ success: true });
    mockSignIn.mockResolvedValue({ 
      success: true, 
      data: { 
        user: { 
          id: 1, 
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        } 
      } 
    } as any);
  });

  it('should render login form elements correctly', () => {
    render(<LoginForm />);

    // Check for form elements
    expect(screen.getByTestId('label-email')).toBeInTheDocument();
    expect(screen.getByTestId('label-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
    
    // Check button text
    expect(screen.getByTestId('button')).toHaveTextContent('Login');
  });

  it('should handle form submission with valid credentials', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Submit the form
    await user.click(submitButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check that success toast was called
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Anmeldung erfolgreich',
        variant: 'success',
      })
    );
  });

  it('should show validation error for empty fields', async () => {
    render(<LoginForm />);

    // Find the form element by its tag name since it doesn't have a role="form"
    const formElement = document.querySelector('form');
    expect(formElement).toBeInTheDocument();
    
    // Submit the form directly
    fireEvent.submit(formElement!);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Ensure AuthService.signIn was not called
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should show loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Make the signIn method hang to simulate loading
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Submit the form
    await user.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Logging in...');
      expect(submitButton).toBeDisabled();
    });
  });

  it('should display error message on authentication failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    
    // Mock authentication failure
    mockSignIn.mockRejectedValue(new Error(errorMessage));
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form with invalid credentials
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    
    // Submit the form
    await user.click(submitButton);

    // Wait for error to be displayed
    await waitFor(() => {
      // Check for German error message (component shows German errors)
      expect(screen.getByText(/Ungültige E-Mail oder Passwort/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that error icon is displayed
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should handle network errors appropriately', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    mockSignIn.mockRejectedValue(new Error('Network error'));
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Submit the form
    await user.click(submitButton);

    // Wait for network error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Netzwerkfehler/i)).toBeInTheDocument();
    });

    // Check that appropriate toast was called
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Verbindungsfehler',
        variant: 'destructive',
      })
    );
  });

  it('should clear error message when user types in inputs', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    
    // Find the form element and submit it directly to trigger validation error
    const formElement = document.querySelector('form');
    expect(formElement).toBeInTheDocument();
    
    // Submit the form to trigger validation error
    fireEvent.submit(formElement!);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    });

    // Now type in the email field
    await user.type(emailInput, 'test@example.com');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/Email and password are required/i)).not.toBeInTheDocument();
    });
  });

  it('should handle form submission via Enter key', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Press Enter in password field
    await user.keyboard('{Enter}');

    // Should trigger form submission
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should prevent multiple simultaneous submissions', async () => {
    const user = userEvent.setup();
    
    // Make signIn take some time to resolve
    mockSignIn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ 
        success: true, 
        data: { user: { id: 1 } } 
      } as any), 100))
    );
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Click submit button twice quickly
    await user.click(submitButton);
    await user.click(submitButton);

    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 1000 });

    // Should only have been called once
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('should handle inactive account error', async () => {
    const user = userEvent.setup();
    
    // Mock inactive account error
    mockSignIn.mockRejectedValue(new Error('Account is not active'));
    
    render(<LoginForm />);

    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByTestId('button');

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Submit the form
    await user.click(submitButton);

    // Wait for inactive account error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Ihr Konto ist nicht aktiv/i)).toBeInTheDocument();
    });

    // Check that appropriate toast was called
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Konto inaktiv',
        variant: 'destructive',
      })
    );
  });
});