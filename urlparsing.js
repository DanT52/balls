import { getUIValues, getBalls } from './uiControls.js';

// Serialize all settings (physics and per-ball) to a single object
export function serializeAllSettings() {
  return {
    physics: getUIValues(),
    balls: getBalls()
  };
}

// Update the URL with the current settings without reloading the page
export function updateURL() {
  const config = serializeAllSettings();
  const encoded = encodeURIComponent(JSON.stringify(config));
  // Build a URL like "…?config=…" without reloading the page
  const newUrl = window.location.pathname + '?config=' + encoded;
  window.history.replaceState(null, '', newUrl);
}

// Get settings from URL if available
export function getSettingsFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('config')) {
    try {
      const config = JSON.parse(decodeURIComponent(params.get('config')));
      return config; // { physics: {...}, balls: [...] }
    } catch (e) {
      console.warn('Invalid URL config – falling back to localStorage', e);
      return null;
    }
  }
  return null;
}

// Helper function to apply physics settings to UI inputs
export function applyPhysicsSettings({ gravity, elasticity, friction, slowMotionFactor, darkMode }) {
  const gravityInput = document.getElementById('gravity');
  const elasticityInput = document.getElementById('elasticity');
  const frictionInput = document.getElementById('friction');
  const slowMotionSlider = document.getElementById('slow-motion');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  if (gravityInput && gravity !== undefined) gravityInput.value = gravity;
  if (elasticityInput && elasticity !== undefined) elasticityInput.value = elasticity;
  if (frictionInput && friction !== undefined) frictionInput.value = friction;
  if (slowMotionSlider && slowMotionFactor !== undefined) {
    slowMotionSlider.value = slowMotionFactor;
    // Update display
    const slowMotionValue = document.getElementById('slow-motion-value');
    if (slowMotionValue) {
      const displayValue = parseFloat(slowMotionFactor).toFixed(1) + 'x';
      slowMotionValue.textContent = displayValue;
    }
  }
  
  // Set dark mode if specified
  if (darkMode !== undefined && darkModeToggle) {
    darkModeToggle.checked = darkMode;
    import('./script.js').then(module => {
      module.setDarkMode(darkMode);
    });
  }
}

// Create a shareable URL with current settings
export function createShareableURL() {
  const config = serializeAllSettings();
  const encoded = encodeURIComponent(JSON.stringify(config));
  return window.location.origin + window.location.pathname + '?config=' + encoded;
}

// Copy the current URL to clipboard
export function copyURLToClipboard() {
  const shareableURL = createShareableURL();
  navigator.clipboard.writeText(shareableURL)
    .then(() => {
      // Provide feedback for successful copy
      const feedbackEl = document.getElementById('share-feedback');
      if (feedbackEl) {
        feedbackEl.textContent = "URL copied to clipboard!";
        feedbackEl.style.opacity = "1";
        setTimeout(() => {
          feedbackEl.style.opacity = "0";
        }, 2000);
      } else {
        alert("Settings URL copied to clipboard!");
      }
    })
    .catch(err => {
      console.error('Could not copy URL: ', err);
      alert("Failed to copy URL. Please try again.");
    });
}
