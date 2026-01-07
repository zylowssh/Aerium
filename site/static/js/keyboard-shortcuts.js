/**
 * Keyboard Shortcuts for Aerium CO₂ Monitor
 * Provides accessible keyboard navigation and quick actions
 */

(function() {
  'use strict';

  const shortcuts = {
    '/': { action: 'search', description: 'Ouvrir la recherche' },
    'k': { action: 'search', ctrl: true, description: 'Ouvrir la recherche (Ctrl+K)' },
    'h': { action: 'home', description: 'Aller à l\'accueil' },
    'd': { action: 'dashboard', description: 'Ouvrir le tableau de bord' },
    'l': { action: 'live', description: 'Vue en direct' },
    's': { action: 'settings', description: 'Paramètres' },
    'Escape': { action: 'closeModal', description: 'Fermer les modales (ESC)' },
    '?': { action: 'help', description: 'Afficher l\'aide des raccourcis' }
  };

  let helpModalOpen = false;

  function handleKeyPress(e) {
    // Ignore if typing in input/textarea
    if (e.target.matches('input, textarea, select')) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    const key = e.key.toLowerCase();
    const shortcut = shortcuts[key] || shortcuts[e.key];

    if (!shortcut) return;

    // Check modifiers
    if (shortcut.ctrl && !e.ctrlKey) return;
    if (shortcut.alt && !e.altKey) return;

    e.preventDefault();
    executeAction(shortcut.action);
  }

  function executeAction(action) {
    switch (action) {
      case 'search':
        openSearch();
        break;
      case 'home':
        window.location.href = '/';
        break;
      case 'dashboard':
        window.location.href = '/dashboard';
        break;
      case 'live':
        window.location.href = '/live';
        break;
      case 'settings':
        window.location.href = '/settings';
        break;
      case 'closeModal':
        closeAllModals();
        break;
      case 'help':
        toggleHelpModal();
        break;
    }
  }

  function openSearch() {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function closeAllModals() {
    // Close any visible modals
    document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
      if (modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    });
    
    // Close help modal
    if (helpModalOpen) {
      toggleHelpModal();
    }
  }

  function toggleHelpModal() {
    let modal = document.getElementById('keyboard-shortcuts-modal');
    
    if (!modal) {
      modal = createHelpModal();
      document.body.appendChild(modal);
    }

    helpModalOpen = !helpModalOpen;
    modal.style.display = helpModalOpen ? 'flex' : 'none';
  }

  function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'keyboard-shortcuts-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Raccourcis clavier');

    const content = document.createElement('div');
    content.style.cssText = `
      background: #0b0d12;
      color: #fff;
      padding: 32px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(61, 217, 143, 0.2);
    `;

    let html = '<h2 style="margin-top:0; color:#3dd98f; font-size:1.5rem; margin-bottom:16px;">⌨️ Raccourcis clavier</h2>';
    html += '<div style="display:grid; gap:12px;">';

    Object.entries(shortcuts).forEach(([key, config]) => {
      const displayKey = key === ' ' ? 'Space' : key.toUpperCase();
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.05); border-radius:6px;">
          <span style="color:#9ca3af;">${config.description}</span>
          <kbd style="background:#1e2028; padding:4px 8px; border-radius:4px; font-family:monospace; color:#3dd98f; border:1px solid rgba(61,217,143,0.3);">${displayKey}</kbd>
        </div>
      `;
    });

    html += '</div>';
    html += '<button id="close-shortcuts-modal" style="margin-top:24px; width:100%; padding:12px; background:linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%); color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:600;">Fermer</button>';

    content.innerHTML = html;
    modal.appendChild(content);

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        toggleHelpModal();
      }
    });

    // Close button
    content.querySelector('#close-shortcuts-modal').addEventListener('click', toggleHelpModal);

    return modal;
  }

  // Initialize
  document.addEventListener('keydown', handleKeyPress);

  // Add visual indicator for keyboard shortcuts help
  window.addEventListener('load', () => {
    const indicator = document.createElement('button');
    indicator.innerHTML = '⌨️';
    indicator.title = 'Raccourcis clavier (?)';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%);
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 9000;
      transition: transform 0.2s;
    `;
    indicator.addEventListener('mouseover', () => {
      indicator.style.transform = 'scale(1.1)';
    });
    indicator.addEventListener('mouseout', () => {
      indicator.style.transform = 'scale(1)';
    });
    indicator.addEventListener('click', toggleHelpModal);
    document.body.appendChild(indicator);
  });

  // Export for external use
  window.KeyboardShortcuts = {
    open: openSearch,
    help: toggleHelpModal
  };
})();
