export const getCsrfToken = async (): Promise<string> => {
    try {
      const response = await fetch('http://localhost:9295/auth/csrf-token', {
        credentials: 'include' // Important for cookies
      });
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      return '';
    }
  };