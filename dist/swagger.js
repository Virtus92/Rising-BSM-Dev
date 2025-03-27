
      // Fix for CORS and network issues in Swagger UI
      (function() {
        console.log('Swagger UI custom script loaded');
        
        // Override fetch with improved error handling
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          console.log('Fetch request:', url, options);
          
          // Add proper headers to avoid CORS issues
          if (!options) options = {};
          if (!options.headers) options.headers = {};
          options.headers['Accept'] = 'application/json';
          
          // For API requests, add Content-Type
          if (url.toString().includes('/api/')) {
            options.headers['Content-Type'] = 'application/json';
          }
          
          // Use proper mode
          options.mode = 'cors';
          options.credentials = 'include';
          
          return originalFetch(url, options)
            .then(response => {
              if (!response.ok) {
                console.error('Fetch error:', response.status, response.statusText);
              }
              return response;
            })
            .catch(error => {
              console.error('Fetch error:', error);
              throw error;
            });
        };
      })();
    