import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setupServer, rest, createMockUser } from '@/test-utils';
import  LoginForm from '../components/LoginForm';
import { AuthProvider } from '../providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/auth/login')
}));

// Setup MSW server
const server = setupServer(
  // Login endpoint
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json();
    
    if (email === 'test@example.com' && password === 'Password123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: createMockUser({
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            }),
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        }),
        ctx.cookie('auth_token', 'mock-access-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 900 // 15 minutes
        }),
        ctx.cookie('refresh_token', 'mock-refresh-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 604800 // 7 days
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid credentials'
      })
    );
  }),
  
  // Token validation endpoint
  rest.get('/api/auth/token', (req, res, ctx) => {
    const authCookie = req.cookies.auth_token;
    
    if (authCookie === 'mock-access-token') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: createMockUser({
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            })
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Not authenticated'
      })
    );
  }),
  
  // Logout endpoint
  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully'
      }),
      ctx.cookie('auth_token', '', { maxAge: 0 }),
      ctx.cookie('refresh_token', '', { maxAge: 0 })
    );
  }),
  
  // Refresh token endpoint
  rest.post('/api/auth/refresh', (req, res, ctx) => {
    const refreshCookie = req.cookies.refresh_token;
    
    if (refreshCookie === 'mock-refresh-token') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: createMockUser({
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            }),
            accessToken: 'new-mock-access-token',
            refreshToken: 'new-mock-refresh-token'
          }
        }),
        ctx.cookie('auth_token', 'new-mock-access-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 900
        }),
        ctx.cookie('refresh_token', 'new-mock-refresh-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 604800
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid refresh token'
      })
    );
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Authentication Flow Integration', () => {
  const mockPush = jest.fn();
  const user = userEvent.setup();
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn()
    });
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      renderWithAuth(<LoginForm />);
      
      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // Wait for login to complete
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      
      // Verify success message
      expect(screen.getByText(/you have been logged in successfully/i)).toBeInTheDocument();
    });

    it('should handle invalid credentials', async () => {
      renderWithAuth(<LoginForm />);
      
      // Fill in login form with wrong credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'WrongPassword');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
      
      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      // Override the handler to simulate network error
      server.use(
        rest.post('/api/auth/login', (req, res) => {
          return res.networkError('Failed to connect');
        })
      );
      
      renderWithAuth(<LoginForm />);
      
      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session after page refresh', async () => {
      // Simulate existing auth cookie
      document.cookie = 'auth_token=mock-access-token; path=/';
      
      // Create authenticated context
      const AuthenticatedComponent = () => {
        const { user, isAuthenticated } = useAuth();
        
        if (!isAuthenticated) {
          return <div>Not authenticated</div>;
        }
        
        return (
          <div>
            <h1>Welcome, {user?.name}</h1>
            <p>Email: {user?.email}</p>
          </div>
        );
      };
      
      renderWithAuth(<AuthenticatedComponent />);
      
      // Should show authenticated state
      await waitFor(() => {
        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
        expect(screen.getByText(/email: test@example.com/i)).toBeInTheDocument();
      });
    });

    it('should handle token refresh automatically', async () => {
      // Start with valid tokens
      document.cookie = 'auth_token=mock-access-token; path=/';
      document.cookie = 'refresh_token=mock-refresh-token; path=/';
      
      // Override token endpoint to simulate expired token
      server.use(
        rest.get('/api/auth/token', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              success: false,
              message: 'Token expired'
            })
          );
        })
      );
      
      const AuthenticatedComponent = () => {
        const { user, isAuthenticated } = useAuth();
        
        if (!isAuthenticated) {
          return <div>Not authenticated</div>;
        }
        
        return <div>Welcome, {user?.name}</div>;
      };
      
      renderWithAuth(<AuthenticatedComponent />);
      
      // Should attempt refresh and succeed
      await waitFor(() => {
        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow successfully', async () => {
      // Start authenticated
      document.cookie = 'auth_token=mock-access-token; path=/';
      
      const LogoutComponent = () => {
        const { signOut, isAuthenticated } = useAuth();
        
        return (
          <div>
            {isAuthenticated ? (
              <button onClick={signOut}>Logout</button>
            ) : (
              <div>Logged out</div>
            )}
          </div>
        );
      };
      
      renderWithAuth(<LogoutComponent />);
      
      // Click logout
      const logoutButton = await screen.findByRole('button', { name: /logout/i });
      await user.click(logoutButton);
      
      // Should show logged out state
      await waitFor(() => {
        expect(screen.getByText(/logged out/i)).toBeInTheDocument();
      });
      
      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', async () => {
      const ProtectedComponent = () => {
        const { isAuthenticated } = useAuth();
        
        React.useEffect(() => {
          if (!isAuthenticated) {
            mockPush('/auth/login');
          }
        }, [isAuthenticated]);
        
        if (!isAuthenticated) {
          return null;
        }
        
        return <div>Protected content</div>;
      };
      
      renderWithAuth(<ProtectedComponent />);
      
      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should allow access to protected route with valid auth', async () => {
      // Set auth cookie
      document.cookie = 'auth_token=mock-access-token; path=/';
      
      const ProtectedComponent = () => {
        const { isAuthenticated, user } = useAuth();
        
        if (!isAuthenticated) {
          return <div>Loading...</div>;
        }
        
        return (
          <div>
            <h1>Protected content</h1>
            <p>User: {user?.name}</p>
          </div>
        );
      };
      
      renderWithAuth(<ProtectedComponent />);
      
      // Should show protected content
      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
        expect(screen.getByText(/user: test user/i)).toBeInTheDocument();
      });
    });
  });
});

// Import useAuth hook
import { useAuth } from '../hooks/useAuthManagement';