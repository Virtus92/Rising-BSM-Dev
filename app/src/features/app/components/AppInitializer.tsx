'use client';

/**
 * AppInitializer Component
 *
 * Handles application initialization with proper service ordering and dependency resolution.
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getLogger } from '@/core/logging';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import AuthService from '@/features/auth/core';

const logger = getLogger();

// Interface for props
export interface AppInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  options?: {
    timeout?: number;
    debug?: boolean;
  };
}

/**
 * AppInitializer - Ensures all core services are initialized before rendering the application
 */
export default function AppInitializer({ children, fallback, options = {} }: AppInitializerProps) {
  // State
  const [initialized, setInitialized] = useState(false);
  const [initPhase, setInitPhase] = useState<string>('start');
  const [initError, setInitError] = useState<string | null>(null);
  const pathname = usePathname();

  // Context hooks
  const { isAuthenticated, user } = useAuth();
  const permissions = usePermissions();

  // Options
  const timeout = options.timeout || 30000;
  const debug = options.debug || false;
  
  // Skip initialization for auth pages
  const isAuthPage = pathname?.startsWith('/auth/') || false;
  
  // Global initialization state key
  const INIT_STATE_KEY = '__APP_INIT_STATE__';
  
  // Helper to access initialization state
  const getInitState = () => {
    if (typeof window === 'undefined') {
      return { initialized: false, initializing: false, timestamp: 0, phase: '' };
    }
    
    if (!(window as any)[INIT_STATE_KEY]) {
      (window as any)[INIT_STATE_KEY] = { 
        initialized: false, 
        initializing: false, 
        timestamp: 0,
        phase: '',
        error: null
      };
    }
    
    return (window as any)[INIT_STATE_KEY];
  };
  
  // Helper to update initialization state
  const updateInitState = (updates: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    
    const state = getInitState();
    (window as any)[INIT_STATE_KEY] = { 
      ...state, 
      ...updates, 
      timestamp: Date.now() 
    };
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('app-init-state-change', {
      detail: (window as any)[INIT_STATE_KEY]
    }));
  };

  useEffect(() => {
    // Skip if already initialized or on auth page
    if (initialized || isAuthPage) {
      return;
    }
    
    // Check global state
    const state = getInitState();
    
    if (state.initialized) {
      setInitialized(true);
      setInitPhase('already-initialized');
      return;
    }
    
    // Check for stalled initialization - increase timeout to 60 seconds
    const isStalled = state.initializing && 
                     state.timestamp && 
                     (Date.now() - state.timestamp > 60000);
    
    if (state.initializing && !isStalled) {
      // Already initializing, wait for it
      logger.debug('Another initialization process is running, waiting', {
        initStartedAt: new Date(state.timestamp).toISOString(),
        currentPhase: state.phase,
        ageInSeconds: Math.floor((Date.now() - state.timestamp) / 1000)
      });
      
      const handleInitStateChange = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail?.initialized) {
          setInitialized(true);
          setInitPhase('synced');
        }
      };
      
      window.addEventListener('app-init-state-change', handleInitStateChange);
      
      // Add an emergency timeout to prevent forever loading states
      const emergencyTimeoutId = setTimeout(() => {
        logger.warn('Emergency timeout triggered - forcing initialization', {
          waitedForSeconds: Math.floor((Date.now() - state.timestamp) / 1000),
          lastPhase: state.phase,
        });
        
        // Force initialization by clearing the stale state
        updateInitState({ initializing: false, error: 'Emergency timeout triggered' });
        
        // Trigger a new initialization attempt
        updateInitState({ initializing: true, phase: 'start', timestamp: Date.now() });
        setInitPhase('start');
        initApp();
      }, 45000); // 45 second emergency timeout
      
      return () => {
        window.removeEventListener('app-init-state-change', handleInitStateChange);
        clearTimeout(emergencyTimeoutId);
      };
    }
    
    // Set initializing state
    updateInitState({ initializing: true, phase: 'start', timestamp: Date.now() });
    setInitPhase('start');

    // Initialize application
    const initApp = async () => {
      try {
        logger.info('Starting application initialization');

        // Phase 1: Initialize auth service
        setInitPhase('auth');
        updateInitState({ phase: 'auth' });
        
        logger.info('Initializing authentication service');
        const authResult = await AuthService.initialize({ force: true });
        
        if (!authResult) {
          logger.warn('Auth service initialization failed');
        } else {
          logger.info('Auth service initialized successfully');
        }
        
        // Phase 2: Load permissions if authenticated
        if (isAuthenticated && user && permissions) {
          setInitPhase('permissions');
          updateInitState({ phase: 'permissions' });
          
          logger.info('Loading permissions');
          
          // Direct call to load permissions - no fallbacks or retries
          try {
            await permissions.loadPermissions();
            logger.info('Permissions loaded successfully');
          } catch (permError) {
            // Log error and let it fail properly
            logger.error('Error loading permissions:', {
              error: permError instanceof Error ? permError.message : String(permError),
              stack: permError instanceof Error ? permError.stack : undefined
            });
            
            // No fallbacks, no retries - just propagate the error
            throw permError;
          }
        }
        
        // Phase 3: Initialization complete
        setInitPhase('complete');
        updateInitState({ initializing: false, initialized: true, phase: 'complete' });
        setInitialized(true);
        
        logger.info('Application initialization completed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Application initialization failed', { error: errorMessage });
        
        // Update state
        setInitError(errorMessage);
        setInitialized(true); // Mark as initialized to unblock UI
        updateInitState({ 
          initializing: false, 
          initialized: false, 
          phase: 'error',
          error: errorMessage
        });
      }
    };

    // Start initialization
    initApp();
    
    // Cleanup
    return () => {
      const state = getInitState();
      if (state.initializing && state.phase === 'start') {
        updateInitState({ initializing: false });
      }
    };
  }, [initialized, isAuthPage, isAuthenticated, user, permissions, timeout, debug]);

  // If on auth page, don't wait for initialization
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show fallback during initialization
  if (!initialized) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Initializing application{initPhase ? `: ${initPhase}` : ''}...
          </p>
          {debug && initPhase && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Phase: {initPhase}</p>
          )}
        </div>
      </div>
    );
  }

  // Show error if initialization failed
  if (initError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md p-8 mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Initialization Error</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">{initError}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Render children when initialized
  return <>{children}</>;
}