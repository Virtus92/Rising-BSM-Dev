let csrfToken: string | null = null;

export const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch('http://localhost:9295/auth/csrf-token', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    
    // Set the CSRF token as a meta tag in the document head
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', csrfToken);
    } else {
      const newMetaTag = document.createElement('meta');
      newMetaTag.name = 'csrf-token';
      newMetaTag.content = csrfToken || '';
      document.head.appendChild(newMetaTag);
    }
    
    return csrfToken!;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return '';
  }
};

export const resetCsrfToken = () => {
  csrfToken = null;
};