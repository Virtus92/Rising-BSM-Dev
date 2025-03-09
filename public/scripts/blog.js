/**
 * Rising BSM Blog Scripts
 * Handles client-side functionality for the blog
 */

document.addEventListener('DOMContentLoaded', function() {
    // Cookie Banner
    initCookieBanner();
    
    // Lazy loading images
    initLazyLoading();
    
    // Initialize reading progress bar if on single post
    initReadingProgress();
    
    // Initialize social sharing functionality
    initSocialSharing();
    
    // Initialize AI generation status updater
    initAiStatusUpdater();
    
    // Initialize editor if found
    initRichTextEditor();
  });
  
  /**
   * Cookie Banner Functionality
   */
  function initCookieBanner() {
    const cookieBanner = document.getElementById('cookieConsentBanner');
    if (!cookieBanner) return;
    
    const acceptAllBtn = document.getElementById('acceptAllCookies');
    const rejectAllBtn = document.getElementById('rejectAllCookies');
    const acceptSelectedBtn = document.getElementById('acceptSelectedCookies');
    const detailsToggle = document.getElementById('cookieDetailsToggle');
    const cookieDetails = document.getElementById('cookieDetails');
    
    // Check if consent already given
    if (!localStorage.getItem('cookieConsent')) {
      cookieBanner.classList.add('show');
    }
    
    // Toggle details
    if (detailsToggle && cookieDetails) {
      detailsToggle.addEventListener('click', function() {
        if (cookieDetails.style.display === 'none') {
          cookieDetails.style.display = 'block';
          detailsToggle.textContent = 'Details ausblenden';
        } else {
          cookieDetails.style.display = 'none';
          detailsToggle.textContent = 'Details anzeigen';
        }
      });
    }
    
    // Accept all cookies
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function() {
        const consentData = {
          necessary: true,
          analytics: true,
          chatbot: true,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        cookieBanner.classList.remove('show');
        
        // Here you would initialize any consent-requiring services
        initAnalytics();
        initChatbot();
      });
    }
    
    // Reject all cookies
    if (rejectAllBtn) {
      rejectAllBtn.addEventListener('click', function() {
        const consentData = {
          necessary: true,
          analytics: false,
          chatbot: false,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        cookieBanner.classList.remove('show');
      });
    }
    
    // Accept selected cookies
    if (acceptSelectedBtn) {
      acceptSelectedBtn.addEventListener('click', function() {
        const analyticsConsent = document.getElementById('analyticsCookies')?.checked || false;
        const chatbotConsent = document.getElementById('chatbotCookies')?.checked || false;
        
        const consentData = {
          necessary: true,
          analytics: analyticsConsent,
          chatbot: chatbotConsent,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        cookieBanner.classList.remove('show');
        
        // Initialize consented services
        if (analyticsConsent) initAnalytics();
        if (chatbotConsent) initChatbot();
      });
    }
  }
  
  /**
   * Initialize analytics (placeholder)
   */
  function initAnalytics() {
    // This would be where you initialize analytics tools
    console.log('Analytics initialized');
  }
  
  /**
   * Initialize chatbot (placeholder)
   */
  function initChatbot() {
    // This would be where you initialize a chatbot
    console.log('Chatbot initialized');
  }
  
  /**
   * Initialize lazy loading for images
   */
  function initLazyLoading() {
    // Check if browser supports native lazy loading
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading supported
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      
      // Add loading="lazy" to any images that don't have it
      document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
      });
    } else {
      // Native lazy loading not supported, implement custom solution
      const lazyImages = document.querySelectorAll('.lazy');
      
      if (lazyImages.length > 0) {
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              if (lazyImage.dataset.srcset) {
                lazyImage.srcset = lazyImage.dataset.srcset;
              }
              lazyImage.classList.remove('lazy');
              lazyImageObserver.unobserve(lazyImage);
            }
          });
        });
        
        lazyImages.forEach(lazyImage => {
          lazyImageObserver.observe(lazyImage);
        });
      }
    }
  }
  
  /**
   * Initialize reading progress bar on single post
   */
  function initReadingProgress() {
    const progressBar = document.getElementById('readingProgressBar');
    
    if (progressBar) {
      window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        progressBar.style.width = scrolled + '%';
      });
    }
  }
  
  /**
   * Initialize social sharing functionality
   */
  function initSocialSharing() {
    const shareButtons = document.querySelectorAll('.blog-share a');
    
    shareButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const url = this.getAttribute('href');
        const windowWidth = 600;
        const windowHeight = 400;
        const windowLeft = (window.innerWidth - windowWidth) / 2;
        const windowTop = (window.innerHeight - windowHeight) / 2;
        
        // Special case for mailto links
        if (url.startsWith('mailto:')) {
          window.location.href = url;
          return;
        }
        
        window.open(
          url,
          'share',
          `width=${windowWidth},height=${windowHeight},left=${windowLeft},top=${windowTop}`
        );
      });
    });
  }
  
  /**
   * Check AI generation status periodically
   */
  function initAiStatusUpdater() {
    const statusContainer = document.querySelector('[data-ai-request-id]');
    if (!statusContainer) return;
    
    const requestId = statusContainer.dataset.aiRequestId;
    
    if (requestId) {
      const checkStatus = async () => {
        try {
          const response = await fetch(`/dashboard/blog/generate/status/${requestId}`);
          const data = await response.json();
          
          if (data.success) {
            // Update status display
            if (data.status === 'completed' && data.result_post_id) {
              statusContainer.innerHTML = `
                <div class="alert alert-success">
                  <div class="d-flex">
                    <div class="me-3"><i class="fas fa-check-circle fa-2x"></i></div>
                    <div>
                      <h5 class="alert-heading mb-1">Generierung abgeschlossen!</h5>
                      <p class="mb-2">Der Beitrag wurde erfolgreich erstellt.</p>
                      <a href="/dashboard/blog/${data.result_post_id}" class="btn btn-success">Beitrag anzeigen</a>
                    </div>
                  </div>
                </div>
              `;
              // Stop checking
              return clearInterval(statusInterval);
            } else if (data.status === 'failed') {
              statusContainer.innerHTML = `
                <div class="alert alert-danger">
                  <div class="d-flex">
                    <div class="me-3"><i class="fas fa-exclamation-circle fa-2x"></i></div>
                    <div>
                      <h5 class="alert-heading mb-1">Generierung fehlgeschlagen</h5>
                      <p class="mb-2">Bei der Generierung ist ein Fehler aufgetreten.</p>
                      <a href="/dashboard/blog/generate" class="btn btn-primary">Erneut versuchen</a>
                    </div>
                  </div>
                </div>
              `;
              // Stop checking
              return clearInterval(statusInterval);
            } else {
              // Update progress indicator for pending/processing
              const progressPercentage = data.status === 'processing' ? 65 : 25;
              const progressBar = statusContainer.querySelector('.progress-bar');
              if (progressBar) {
                progressBar.style.width = `${progressPercentage}%`;
                progressBar.setAttribute('aria-valuenow', progressPercentage);
              }
            }
          }
        } catch (error) {
          console.error('Fehler beim Abrufen des Status:', error);
        }
      };
      
      // Initial check
      checkStatus();
      
      // Set up interval for checking (every 10 seconds)
      const statusInterval = setInterval(checkStatus, 10000);
    }
  }
  
  /**
   * Initialize rich text editor for blog content
   */
  function initRichTextEditor() {
    const contentTextarea = document.getElementById('content');
    
    if (contentTextarea && typeof ClassicEditor !== 'undefined') {
      ClassicEditor
        .create(contentTextarea, {
          toolbar: [
            'heading', '|', 
            'bold', 'italic', 'link', '|',
            'bulletedList', 'numberedList', '|',
            'blockQuote', 'insertTable', '|',
            'undo', 'redo'
          ],
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
            ]
          }
        })
        .catch(error => {
          console.error('CKEditor initialization error:', error);
        });
    }
    
    // Initialize Select2 for tags if available
    if (typeof $ !== 'undefined' && $.fn.select2 && document.getElementById('tags')) {
      $('#tags').select2({
        tags: true,
        tokenSeparators: [',', ' '],
        placeholder: "Tags auswählen oder hinzufügen..."
      });
    }
  }