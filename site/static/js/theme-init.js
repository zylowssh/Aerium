/* Theme initialization - must run before DOM content loads to prevent flash */
(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const isLight = savedTheme === 'light';
  const root = document.documentElement;
  
  if (isLight) {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
    root.style.setProperty('--bg', '#f8f9fa');
    root.style.setProperty('--bg-solid', '#f8f9fa');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--card-solid', '#ffffff');
    root.style.setProperty('--text', '#1a1f36');
    root.style.setProperty('--muted', '#6c757d');
    root.style.setProperty('--good', '#28a745');
    root.style.setProperty('--medium', '#ffc107');
    root.style.setProperty('--bad', '#dc3545');
    root.style.setProperty('--accent', '#0066cc');
    root.style.setProperty('--accent-alt', '#004c99');
    root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #0066cc 0%, #004c99 100%)');
    root.style.setProperty('--border-light', 'rgba(0,102,204,0.15)');
    root.style.setProperty('--border-dark', 'rgba(0,102,204,0.08)');
    root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.08)');
    root.style.setProperty('--shadow-md', '0 4px 12px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-lg', '0 8px 24px rgba(0,0,0,0.12)');
    root.style.setProperty('--shadow-accent', '0 4px 15px rgba(0,102,204,0.15)');
  } else {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  }
  
  // Set logo based on theme after DOM loads
  document.addEventListener('DOMContentLoaded', function() {
    const logoImg = document.getElementById('nav-logo-img');
    if (logoImg && isLight) {
      logoImg.src = logoImg.src.replace('logoWhite.png', 'logoBlack.png');
    }
  });
})();
