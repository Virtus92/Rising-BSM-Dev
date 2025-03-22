import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Request, Response, Application } from 'express';
import config from './swagger.config.js';

// Check if Swagger is enabled
const isSwaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(config);

// Setup Swagger middleware

interface DevTokenResponse {
  token: string;
  instructions: string;
}

interface SwaggerOptions {
  explorer: boolean;
  customCss: string;
  swaggerOptions: {
    persistAuthorization: boolean;
  };
}

export function setupSwagger(app: Application) {
  // Skip setup if Swagger is disabled
  if (!isSwaggerEnabled) {
    console.log('⏭️ Swagger documentation disabled');
    return;
  }

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
    }
  } as SwaggerOptions));
  
  // Serve Swagger specification
  app.get('/swagger.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Development token endpoint
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api-docs/dev-token', (req: Request, res: Response) => {
      const jwt = require('jsonwebtoken');
      const token: string = jwt.sign(
        { userId: 1, role: 'admin', name: 'Developer' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
      );
      
      res.json({
        token,
        instructions: 'Click the Authorize button and enter this token with the "Bearer " prefix'
      } as DevTokenResponse);
    });
    
    // Add authentication helper to Swagger UI
    const authHelper: string = `
      <script>
        window.onload = function() {
          // Add helper button after some delay to ensure Swagger UI is loaded
          setTimeout(function() {
            // Create dev token button
            var authBtn = document.createElement('button');
            authBtn.innerHTML = 'Get Dev Token';
            authBtn.className = 'btn authorize';
            authBtn.style.marginLeft = '10px';
            authBtn.onclick = function() {
              fetch('/api-docs/dev-token')
                .then(response => response.json())
                .then(data => {
                  // Copy to clipboard
                  navigator.clipboard.writeText('Bearer ' + data.token)
                    .then(() => {
                      alert('Token copied to clipboard! Click "Authorize" and paste it.');
                    });
                });
            };
            
            // Find the authorize button container and add our button
            var authorizeBtn = document.querySelector('.swagger-ui .auth-wrapper .authorize');
            if (authorizeBtn && authorizeBtn.parentNode) {
              authorizeBtn.parentNode.appendChild(authBtn);
            }
          }, 1000);
        }
      </script>
    `;
    
    // Inject the script into Swagger UI
    const originalSetup = swaggerUi.setup;
    swaggerUi.setup = (
      spec?: any,
      opts?: any,
      options?: any,
      customCss?: any,
      customfavIcon?: any,
      swaggerUrl?: any,
      customSiteTitle?: any
    ) => {
      const originalResult = originalSetup(spec, opts, options, customCss, customfavIcon, swaggerUrl, customSiteTitle);
      
      return (req: Request, res: Response, next: any) => {
        if (typeof originalResult === 'function') {
          originalResult(req, res, next);
        }
        
        // Add our script to the response
        const originalSend = res.send;
        res.send = function(body?: any): Response {
          let modifiedBody: string = body;
          if (body && typeof body === 'string' && body.includes('</body>')) {
            modifiedBody = body.replace('</body>', authHelper + '</body>');
          }
          return originalSend.call(this, modifiedBody);
        };
      };
    };
  }
  
  console.log(`✅ Swagger documentation available at /api-docs (Host: ${process.env.SWAGGER_HOST || 'localhost:5000'})`);
}

export default setupSwagger;