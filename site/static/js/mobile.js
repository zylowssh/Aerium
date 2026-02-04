/*
================================================================================
                    MOBILE MENU & RESPONSIVE ENHANCEMENTS
================================================================================
Provides mobile-friendly navigation with hamburger menu and touch optimizations
*/

let mobileMenuOpen = false;

function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (!toggleBtn || !mobileMenu) return;
  
  toggleBtn.addEventListener('click', () => {
    mobileMenuOpen = !mobileMenuOpen;
    mobileMenu.classList.toggle('active', mobileMenuOpen);
    toggleBtn.setAttribute('aria-expanded', mobileMenuOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
  });
  
  // Close menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuOpen = false;
      mobileMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMenuOpen && !mobileMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      mobileMenuOpen = false;
      mobileMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }
  });
  
  // Close menu on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      mobileMenuOpen = false;
      mobileMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }
  });
}

/*
================================================================================
                    RESPONSIVE TABLE HANDLER
================================================================================
Converts tables to mobile-friendly card layout on small screens
*/

function initResponsiveTables() {
  if (window.innerWidth <= 768) {
    const tables = document.querySelectorAll('table:not(.mobile-cards)');
    
    tables.forEach(table => {
      // Add data-label attributes to td elements for mobile view
      const headers = table.querySelectorAll('th');
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute('data-label', headers[index].textContent);
          }
        });
      });
      
      // Add mobile-cards class
      table.classList.add('mobile-cards');
    });
  }
}

/*
================================================================================
                    CHART RESIZE HANDLER
================================================================================
Handles chart resizing for mobile devices
*/

function initChartResize() {
  let resizeTimer;
  
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Trigger chart resize events
      const event = new Event('chartResize');
      window.dispatchEvent(event);
      
      // Re-check table responsiveness
      initResponsiveTables();
    }, 250);
  });
}

/*
================================================================================
                    TOUCH GESTURES FOR TABLES
================================================================================
Enables horizontal swipe for scrollable tables on mobile
*/

function initTableSwipeGestures() {
  const scrollableTables = document.querySelectorAll('.table-responsive');
  
  scrollableTables.forEach(container => {
    let startX = 0;
    let scrollLeft = 0;
    let isDown = false;
    
    container.addEventListener('touchstart', (e) => {
      isDown = true;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });
    
    container.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    });
    
    container.addEventListener('touchend', () => {
      isDown = false;
    });
  });
}

/*
================================================================================
                    MOBILE VIEWPORT HEIGHT FIX
================================================================================
Fixes the viewport height issue on mobile browsers (address bar)
*/

function setMobileViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/*
================================================================================
                    MOBILE TOUCH FEEDBACK
================================================================================
Adds visual feedback for touch interactions
*/

function initTouchFeedback() {
  const touchElements = document.querySelectorAll('button, a, .btn, .link, .card');
  
  touchElements.forEach(element => {
    element.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    }, {passive: true});
    
    element.addEventListener('touchend', function() {
      setTimeout(() => {
        this.classList.remove('touch-active');
      }, 100);
    }, {passive: true});
    
    element.addEventListener('touchcancel', function() {
      this.classList.remove('touch-active');
    }, {passive: true});
  });
}

/*
================================================================================
                    PREVENT DOUBLE TAP ZOOM ON MOBILE
================================================================================
Prevents double-tap zoom on specific elements
*/

function preventDoubleTapZoom() {
  let lastTap = 0;
  
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      const target = e.target;
      if (target.matches('button, a, .btn, input, select, textarea')) {
        e.preventDefault();
      }
    }
    
    lastTap = currentTime;
  });
}

/*
================================================================================
                    MOBILE ORIENTATION CHANGE HANDLER
================================================================================
Handles device orientation changes
*/

function handleOrientationChange() {
  window.addEventListener('orientationchange', () => {
    // Update viewport height
    setMobileViewportHeight();
    
    // Re-initialize tables
    setTimeout(() => {
      initResponsiveTables();
    }, 100);
    
    // Trigger chart resize
    const event = new Event('chartResize');
    window.dispatchEvent(event);
  });
}

/*
================================================================================
                    SMOOTH SCROLL FOR MOBILE
================================================================================
Enables smooth scrolling on mobile devices
*/

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/*
================================================================================
                    MOBILE SCROLL INDICATOR
================================================================================
Shows scroll indicator for horizontally scrollable content
*/

function initScrollIndicators() {
  const scrollContainers = document.querySelectorAll('.table-responsive, .tab-navigation');
  
  scrollContainers.forEach(container => {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '→';
    indicator.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--accent);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 14px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    container.style.position = 'relative';
    container.appendChild(indicator);
    
    // Show indicator if content is scrollable
    if (container.scrollWidth > container.clientWidth) {
      indicator.style.opacity = '0.7';
      
      container.addEventListener('scroll', () => {
        if (container.scrollLeft > 10) {
          indicator.style.opacity = '0';
        } else {
          indicator.style.opacity = '0.7';
        }
      });
    }
  });
}

/*
================================================================================
                    INITIALIZATION
================================================================================
*/

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initResponsiveTables();
  initChartResize();
  initTableSwipeGestures();
  setMobileViewportHeight();
  handleOrientationChange();
  
  // Only on mobile devices
  if (window.innerWidth <= 768) {
    initTouchFeedback();
    preventDoubleTapZoom();
    initSmoothScroll();
    initScrollIndicators();
  }
});

// Re-initialize on window resize
window.addEventListener('resize', () => {
  setMobileViewportHeight();
});

// Re-initialize on dynamic page loads
function reinitMobileMenu() {
  initMobileMenu();
  initResponsiveTables();
  initTableSwipeGestures();
  
  if (window.innerWidth <= 768) {
    initTouchFeedback();
    initScrollIndicators();
  }
}

// Add touch-active CSS class styles dynamically
const style = document.createElement('style');
style.textContent = `
  .touch-active {
    opacity: 0.7;
    transform: scale(0.98);
    transition: all 0.1s ease;
  }
  
  @media (max-width: 768px) {
    html {
      scroll-behavior: smooth;
    }
  }
`;
document.head.appendChild(style);

