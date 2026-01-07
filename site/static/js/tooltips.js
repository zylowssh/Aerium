/**
 * Dynamic Tooltip System for Aerium CO₂ Monitor
 * Provides accessible hover tooltips for any element with data-tooltip attribute
 */

(function() {
  'use strict';

  let tooltipElement = null;

  function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'dynamic-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.style.cssText = `
      position: fixed;
      padding: 8px 12px;
      background: #1e2028;
      color: #fff;
      border-radius: 6px;
      font-size: 0.875rem;
      pointer-events: none;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 250px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(61, 217, 143, 0.2);
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(element, text) {
    if (!tooltipElement) {
      tooltipElement = createTooltip();
    }

    tooltipElement.textContent = text;
    tooltipElement.style.opacity = '0';
    tooltipElement.style.display = 'block';

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Keep tooltip in viewport
    if (top < 0) {
      top = rect.bottom + 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    tooltipElement.style.top = top + 'px';
    tooltipElement.style.left = left + 'px';

    // Fade in
    requestAnimationFrame(() => {
      tooltipElement.style.opacity = '1';
    });
  }

  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.style.opacity = '0';
      setTimeout(() => {
        if (tooltipElement) {
          tooltipElement.style.display = 'none';
        }
      }, 200);
    }
  }

  function handleMouseEnter(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      const text = element.getAttribute('data-tooltip');
      if (text) {
        showTooltip(element, text);
      }
    }
  }

  function handleMouseLeave(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      hideTooltip();
    }
  }

  // Initialize
  document.addEventListener('mouseover', handleMouseEnter);
  document.addEventListener('mouseout', handleMouseLeave);

  // Export for external use
  window.Tooltips = {
    show: showTooltip,
    hide: hideTooltip
  };
})();
