import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check validation message
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Enter valid test credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show success message
    await expect(page.getByText(/you have been logged in successfully/i)).toBeVisible();
    
    // Should show user menu with user info
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should maintain session after page refresh', async ({ page, context }) => {
    // Login first
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should still show user info
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Click user menu
    await page.getByText(/test user/i).click();
    
    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    
    // Should show logout message
    await expect(page.getByText(/you have been logged out/i)).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    
    // Should show message
    await expect(page.getByText(/please login to continue/i)).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    // Click forgot password link
    await page.getByText(/forgot password/i).click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL('/auth/forgot-password');
    
    // Enter email
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    // Should show success message
    await expect(page.getByText(/password reset link sent/i)).toBeVisible();
  });

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i });
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Authentication - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if form is properly displayed on mobile
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Login should work on mobile
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Authentication - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Focus email
    await expect(page.getByLabel(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus password
    await expect(page.getByLabel(/password/i)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
    
    // Submit form with Enter key
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByLabel(/password/i).press('Enter');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check ARIA labels
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('aria-label', /email/i);
    
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute('aria-label', /password/i);
    
    // Error messages should have alert role
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const emailError = page.getByText(/email is required/i);
    await expect(emailError).toHaveAttribute('role', 'alert');
  });
});

test.describe('Authentication - Performance', () => {
  test('should load login page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should complete login flow within acceptable time', async ({ page }) => {
    await page.goto('/auth/login');
    
    const startTime = Date.now();
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    const loginTime = Date.now() - startTime;
    
    // Login flow should complete within 5 seconds
    expect(loginTime).toBeLessThan(5000);
  });
});