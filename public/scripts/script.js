document.addEventListener("DOMContentLoaded", function() {
  // ==================== PERFORMANCE-OPTIMIERUNGEN ====================
  
  // Prefetch und Preconnect für externe Ressourcen
  function addResourceHints() {
    const hints = [
      { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://cdnjs.cloudflare.com', crossorigin: 'anonymous' },
      { rel: 'dns-prefetch', href: 'https://n8n.dinel.at' }
    ];
    
    const head = document.head || document.getElementsByTagName('head')[0];
    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      head.appendChild(link);
    });
  }
  addResourceHints();

  
  // ==================== NAVIGATION & UI ====================
  
  // Modernes Scroll-Verhalten mit debouncing für Performance
  const navbar = document.getElementById("mainNav");
  if (navbar) {
    let lastScrollTop = 0;
    let isScrolling = false;
    
    // Debounce-Funktion für bessere Scroll-Performance
    function debounce(func, wait = 10) {
      let timeout;
      return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
    }
    
    function handleScroll() {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          let scrollTop = window.scrollY || document.documentElement.scrollTop;
          
          // Navbar-Shrink mit einer minimalen Scrolldistanz für bessere UX
          if (scrollTop > 80) {
            navbar.classList.add("navbar-shrink", "shadow-sm");
          } else {
            navbar.classList.remove("navbar-shrink");
            if (scrollTop <= 10) {
              navbar.classList.remove("shadow-sm");
            }
          }
          
          // Auto-Collapse für das Navigationsmenü beim Scrollen auf mobilen Geräten
          if (scrollTop > lastScrollTop && scrollTop > 100) {
            const navbarCollapse = document.querySelector(".navbar-collapse");
            if (navbarCollapse && navbarCollapse.classList.contains("show")) {
              const bsCollapse = new bootstrap.Collapse(navbarCollapse);
              bsCollapse.hide();
            }
          }
          
          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
          isScrolling = false;
        });
      }
      isScrolling = true;
    }
    
    // Event-Listener mit Debouncing für bessere Performance
    window.addEventListener("scroll", debounce(handleScroll));
    
    // Initial prüfen
    handleScroll();
  }
  
  // Verbesserte Smooth-Scroll-Funktionalität mit Offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // Spezielle Behandlung für #-Links
      if (targetId === "#") return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // Navbar-Höhe für Offset berechnen
        const navbarHeight = document.getElementById('mainNav').offsetHeight;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - navbarHeight - 20;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // URL-Hash aktualisieren ohne Spring-Effekt
        history.pushState(null, null, targetId);
      }
    });
  });
  
  // ==================== ANIMATIONS & VISUAL EFFECTS ====================
  
  // Implementierung der fehlenden Animation für animate-item Elemente
  function initAnimations() {
    const animatedElements = document.querySelectorAll('.animate-item');
    
    if (animatedElements.length === 0) return;
    
    // Intersection Observer für Animation beim Scrollen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.animation || 'fade-up';
          const delay = element.dataset.delay || 0;
          
          setTimeout(() => {
            element.classList.add('animated', animationType);
            element.style.opacity = '1';
          }, delay * 1000);
          
          // Element nach Animation nicht mehr beobachten
          observer.unobserve(element);
        }
      });
    }, { threshold: 0.1 });
    
    // Elemente initial verstecken und dann beobachten
    animatedElements.forEach(element => {
      element.style.opacity = '0';
      observer.observe(element);
    });
  }
  initAnimations();
  
  // Hero Slideshow mit verbesserten Übergängen
  function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    const slideInterval = 5000; // 5 Sekunden
    let slideTimer;
    
    function goToSlide(index) {
      // Aktive Klasse von allen Slides entfernen
      slides.forEach(slide => slide.classList.remove('active', 'animate-slide'));
      
      // Zum ausgewählten Slide wechseln
      currentSlide = (index + slides.length) % slides.length;
      
      // Aktive Klasse und Animation hinzufügen
      slides[currentSlide].classList.add('active', 'animate-slide');
    }
    
    function nextSlide() {
      goToSlide(currentSlide + 1);
    }
    
    function startSlideTimer() {
      stopSlideTimer();
      slideTimer = setInterval(nextSlide, slideInterval);
    }
    
    function stopSlideTimer() {
      if (slideTimer) {
        clearInterval(slideTimer);
      }
    }
    
    // Tastaturbedienung für Barrierefreiheit
    document.addEventListener('keydown', function(e) {
      const heroSection = document.getElementById('hero');
      if (heroSection && isElementInViewport(heroSection)) {
        if (e.key === 'ArrowLeft') {
          goToSlide(currentSlide - 1);
          startSlideTimer();
        } else if (e.key === 'ArrowRight') {
          goToSlide(currentSlide + 1);
          startSlideTimer();
        }
      }
    });
    
    // Slideshow starten
    startSlideTimer();
  }
  initHeroSlideshow();  
  
  // ==================== UTILITY FUNKTIONEN ====================
  
  // Hilfsfunktion zur Prüfung, ob ein Element sichtbar ist
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Automatisches Copyright Jahr
  const yearElements = document.querySelectorAll('#currentYear');
  yearElements.forEach(el => {
    el.textContent = new Date().getFullYear();
  });

});