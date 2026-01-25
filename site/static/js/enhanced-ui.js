/**
 * Enhanced UI Components - Modern Improvements for Aerium
 * Features: Loading skeletons, micro-interactions, smooth transitions
 */

(function() {
  'use strict';

  // ===== LOADING SKELETONS =====
  const SkeletonLoader = {
    create(type = 'card') {
      const templates = {
        card: `
          <div class="skeleton-card">
            <div class="skeleton-header"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        `,
        chart: `
          <div class="skeleton-chart">
            <div class="skeleton-chart-bars"></div>
          </div>
        `,
        stats: `
          <div class="skeleton-stats">
            <div class="skeleton-value"></div>
            <div class="skeleton-label"></div>
          </div>
        `
      };
      
      const wrapper = document.createElement('div');
      wrapper.className = 'skeleton-wrapper';
      wrapper.innerHTML = templates[type] || templates.card;
      return wrapper;
    },

    show(container) {
      if (!container) return;
      container.classList.add('skeleton-loading');
      const skeleton = this.create();
      container.appendChild(skeleton);
    },

    hide(container) {
      if (!container) return;
      container.classList.remove('skeleton-loading');
      const skeleton = container.querySelector('.skeleton-wrapper');
      if (skeleton) skeleton.remove();
    }
  };

  // ===== MICRO-INTERACTIONS =====
  const MicroInteractions = {
    init() {
      this.setupRippleEffect();
      this.setupHoverEffects();
      this.setupScrollAnimations();
    },

    setupRippleEffect() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .link, .card');
        if (!target || target.hasAttribute('no-ripple')) return;

        const ripple = document.createElement('span');
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        target.style.position = 'relative';
        target.style.overflow = 'hidden';
        target.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    },

    setupHoverEffects() {
      const cards = document.querySelectorAll('.card, .overview-widget');
      cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-3px) scale(1.01)';
        });
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0) scale(1)';
        });
      });
    },

    setupScrollAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.card, .hero').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
      });
    }
  };

  // ===== SMOOTH TRANSITIONS =====
  const SmoothTransitions = {
    init() {
      this.setupPageTransitions();
      this.setupNumberAnimations();
    },

    setupPageTransitions() {
      document.body.classList.add('page-transition');
      
      // Fade in on load
      window.addEventListener('load', () => {
        document.body.classList.add('page-loaded');
      });

      // Fade out on navigation
      document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href && !href.startsWith('#')) {
            e.preventDefault();
            document.body.classList.add('page-leaving');
            setTimeout(() => {
              window.location.href = href;
            }, 300);
          }
        });
      });
    },

    setupNumberAnimations() {
      const animateNumber = (element, target, duration = 1000) => {
        const start = parseFloat(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
          current += increment;
          if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target.toFixed(0);
            clearInterval(timer);
          } else {
            element.textContent = current.toFixed(0);
          }
        }, 16);
      };

      // Auto-animate numbers when they come into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.hasAttribute('data-animated')) {
            const value = parseFloat(entry.target.textContent);
            if (!isNaN(value)) {
              entry.target.textContent = '0';
              animateNumber(entry.target, value);
              entry.target.setAttribute('data-animated', 'true');
            }
          }
        });
      });

      document.querySelectorAll('.value, .stat-value, .metric-value').forEach(el => {
        observer.observe(el);
      });
    }
  };

  // ===== PERFORMANCE MONITOR =====
  const PerformanceMonitor = {
    init() {
      if (!('PerformanceObserver' in window)) return;

      // Monitor long tasks
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry.duration + 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver with longtask not supported
      }

      // Report web vitals
      this.reportWebVitals();
    },

    reportWebVitals() {
      if ('web-vital' in window) return; // Already reported

      const sendMetric = (metric) => {
        console.log(`[Web Vital] ${metric.name}:`, metric.value);
        // Could send to analytics here
      };

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          sendMetric({ name: 'FCP', value: entry.startTime });
        }
      });
      try {
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {}

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        sendMetric({ name: 'LCP', value: lastEntry.startTime });
      });
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          sendMetric({ name: 'FID', value: entry.processingStart - entry.startTime });
        }
      });
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {}

      window['web-vital'] = true;
    }
  };

  // ===== ACCESSIBILITY ENHANCEMENTS =====
  const AccessibilityEnhancer = {
    init() {
      this.setupKeyboardNavigation();
      this.setupFocusVisible();
      this.setupAnnouncements();
    },

    setupKeyboardNavigation() {
      // Trap focus in modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.querySelector('.modal.active, dialog[open]');
          if (modal) {
            modal.classList.remove('active');
            modal.close?.();
          }
        }
      });

      // Skip to main content
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--accent);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 10000;
      `;
      skipLink.addEventListener('focus', function() {
        this.style.top = '0';
      });
      skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
      });
      document.body.insertBefore(skipLink, document.body.firstChild);
    },

    setupFocusVisible() {
      let hadKeyboardEvent = true;
      
      document.addEventListener('keydown', () => {
        hadKeyboardEvent = true;
      });
      
      document.addEventListener('mousedown', () => {
        hadKeyboardEvent = false;
      });
      
      document.addEventListener('focusin', (e) => {
        if (hadKeyboardEvent) {
          e.target.classList.add('focus-visible');
        }
      });
      
      document.addEventListener('focusout', (e) => {
        e.target.classList.remove('focus-visible');
      });
    },

    setupAnnouncements() {
      const announcer = document.createElement('div');
      announcer.id = 'aria-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);

      window.announce = (message) => {
        announcer.textContent = '';
        setTimeout(() => {
          announcer.textContent = message;
        }, 100);
      };
    }
  };

  // ===== LAZY LOADING =====
  const LazyLoader = {
    init() {
      this.setupImageLazyLoading();
      this.setupComponentLazyLoading();
    },

    setupImageLazyLoading() {
      if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.loading = 'lazy';
        });
      } else {
        // Fallback for browsers without native support
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    },

    setupComponentLazyLoading() {
      const componentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const component = entry.target;
            const loader = component.dataset.lazyLoad;
            if (loader && window[loader]) {
              window[loader](component);
              componentObserver.unobserve(component);
            }
          }
        });
      });

      document.querySelectorAll('[data-lazy-load]').forEach(el => {
        componentObserver.observe(el);
      });
    }
  };

  // ===== NETWORK STATUS =====
  const NetworkStatus = {
    init() {
      this.showStatus();
      
      window.addEventListener('online', () => {
        this.showToast('✅ Connexion rétablie', 'success');
      });
      
      window.addEventListener('offline', () => {
        this.showToast('⚠️ Hors ligne', 'warning');
      });
    },

    showStatus() {
      if (!navigator.onLine) {
        this.showToast('⚠️ Mode hors ligne', 'warning', 3000);
      }
    },

    showToast(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--card);
        color: var(--text);
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border-light);
        z-index: 10000;
        animation: slideInUp 0.3s ease;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ===== INITIALIZE ALL ENHANCEMENTS =====
  function initEnhancements() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    function init() {
      console.log('[Enhanced UI] Initializing...');
      
      MicroInteractions.init();
      SmoothTransitions.init();
      AccessibilityEnhancer.init();
      LazyLoader.init();
      NetworkStatus.init();
      PerformanceMonitor.init();

      // Add CSS for animations
      injectStyles();
      
      console.log('[Enhanced UI] Ready ✨');
    }
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Ripple Effect */
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      /* Page Transitions */
      .page-transition {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .page-loaded {
        opacity: 1;
      }
      
      .page-leaving {
        opacity: 0;
      }

      /* Scroll Animations */
      .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      /* Skeleton Loading */
      .skeleton-wrapper {
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .skeleton-card,
      .skeleton-chart,
      .skeleton-stats {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 20px;
      }
      
      .skeleton-header {
        width: 60%;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 12px;
      }
      
      .skeleton-line {
        width: 100%;
        height: 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .skeleton-line.short {
        width: 40%;
      }
      
      .skeleton-value {
        width: 80px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .skeleton-label {
        width: 120px;
        height: 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      .skeleton-chart-bars {
        width: 100%;
        height: 200px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.05) 0%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0.05) 100%
        );
        border-radius: 4px;
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      /* Focus Visible */
      .focus-visible {
        outline: 2px solid var(--accent) !important;
        outline-offset: 2px;
      }

      /* Toast Animations */
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(100px);
          opacity: 0;
        }
      }

      /* Enhanced Card Hover */
      .card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      /* Smooth Scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        html {
          scroll-behavior: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Export utilities
  window.EnhancedUI = {
    SkeletonLoader,
    MicroInteractions,
    SmoothTransitions,
    AccessibilityEnhancer,
    LazyLoader,
    NetworkStatus,
    PerformanceMonitor
  };

  // Auto-initialize
  initEnhancements();
})();
