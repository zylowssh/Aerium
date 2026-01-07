/**
 * Real-time Form Validation for Aerium CO₂ Monitor
 * Provides instant feedback on form inputs
 */

(function() {
  'use strict';

  // Password strength checker
  function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push('Au moins 8 caractères');

    if (password.length >= 12) strength++;
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    else feedback.push('Majuscules et minuscules');

    if (/\d/.test(password)) strength++;
    else feedback.push('Au moins un chiffre');

    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else feedback.push('Caractère spécial recommandé');

    const levels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['#ef5350', '#ff9800', '#ffeb3b', '#66bb6a', '#3dd98f'];

    return {
      strength,
      level: levels[Math.min(strength, levels.length - 1)],
      color: colors[Math.min(strength, colors.length - 1)],
      feedback
    };
  }

  // Email validation
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Username validation
  function validateUsername(username) {
    return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
  }

  // Create feedback element
  function createFeedback(input) {
    let feedback = input.nextElementSibling;
    if (!feedback || !feedback.classList.contains('input-feedback')) {
      feedback = document.createElement('div');
      feedback.className = 'input-feedback';
      feedback.style.cssText = `
        margin-top: 4px;
        font-size: 0.875rem;
        min-height: 20px;
      `;
      input.parentNode.insertBefore(feedback, input.nextSibling);
    }
    return feedback;
  }

  // Show feedback
  function showFeedback(input, message, type = 'info') {
    const feedback = createFeedback(input);
    const colors = {
      error: '#ef5350',
      success: '#3dd98f',
      info: '#4db8ff',
      warning: '#ff9800'
    };
    
    feedback.textContent = message;
    feedback.style.color = colors[type] || colors.info;

    // Update input border
    if (type === 'error') {
      input.style.borderColor = colors.error;
    } else if (type === 'success') {
      input.style.borderColor = colors.success;
    } else {
      input.style.borderColor = '';
    }
  }

  // Password strength indicator
  function handlePasswordInput(e) {
    const input = e.target;
    if (input.value.length === 0) {
      showFeedback(input, '', 'info');
      return;
    }

    const result = checkPasswordStrength(input.value);
    const message = `Force: ${result.level}${result.feedback.length > 0 ? ' • ' + result.feedback.join(', ') : ''}`;
    
    const feedbackDiv = createFeedback(input);
    feedbackDiv.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="flex:1; height:4px; background:#2a2d36; border-radius:2px; overflow:hidden;">
          <div style="width:${(result.strength / 5) * 100}%; height:100%; background:${result.color}; transition:all 0.3s;"></div>
        </div>
        <span style="color:${result.color}; font-size:0.75rem;">${result.level}</span>
      </div>
      <div style="color:#9ca3af; font-size:0.75rem; margin-top:2px;">${result.feedback.join(' • ')}</div>
    `;
  }

  // Email validation
  function handleEmailInput(e) {
    const input = e.target;
    if (input.value.length === 0) {
      showFeedback(input, '', 'info');
      return;
    }

    if (validateEmail(input.value)) {
      showFeedback(input, '✓ Email valide', 'success');
    } else {
      showFeedback(input, '✗ Format email invalide', 'error');
    }
  }

  // Username validation
  function handleUsernameInput(e) {
    const input = e.target;
    if (input.value.length === 0) {
      showFeedback(input, '', 'info');
      return;
    }

    if (input.value.length < 3) {
      showFeedback(input, '✗ Minimum 3 caractères', 'error');
    } else if (!validateUsername(input.value)) {
      showFeedback(input, '✗ Lettres, chiffres, - et _ uniquement', 'error');
    } else {
      showFeedback(input, '✓ Nom d\'utilisateur valide', 'success');
    }
  }

  // Confirm password
  function handleConfirmPassword(e) {
    const input = e.target;
    const passwordInput = document.querySelector('input[name="password"], input[name="new_password"]');
    
    if (!passwordInput || input.value.length === 0) {
      showFeedback(input, '', 'info');
      return;
    }

    if (input.value === passwordInput.value) {
      showFeedback(input, '✓ Les mots de passe correspondent', 'success');
    } else {
      showFeedback(input, '✗ Les mots de passe ne correspondent pas', 'error');
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    // Password fields
    document.querySelectorAll('input[name="password"], input[name="new_password"]').forEach(input => {
      input.addEventListener('input', handlePasswordInput);
      input.addEventListener('blur', handlePasswordInput);
    });

    // Email fields
    document.querySelectorAll('input[type="email"], input[name="email"]').forEach(input => {
      input.addEventListener('input', handleEmailInput);
      input.addEventListener('blur', handleEmailInput);
    });

    // Username fields
    document.querySelectorAll('input[name="username"]').forEach(input => {
      input.addEventListener('input', handleUsernameInput);
      input.addEventListener('blur', handleUsernameInput);
    });

    // Confirm password fields
    document.querySelectorAll('input[name="confirm_password"]').forEach(input => {
      input.addEventListener('input', handleConfirmPassword);
      input.addEventListener('blur', handleConfirmPassword);
    });
  });

  // Export for external use
  window.FormValidation = {
    checkPasswordStrength,
    validateEmail,
    validateUsername,
    showFeedback
  };
})();
