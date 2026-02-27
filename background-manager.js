// background-manager.js - Content script for injecting custom backgrounds

(function() {
  'use strict';

  let backgroundElement = null;
  let overlayElement = null;

  // Create background elements
  function createBackgroundElements() {
    // Create background container
    if (!backgroundElement) {
      backgroundElement = document.createElement('div');
      backgroundElement.id = 'roblox-theme-studio-bg';
      backgroundElement.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: -1 !important;
        pointer-events: none !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      `;
      document.body.insertBefore(backgroundElement, document.body.firstChild);
    }

    // Create dark overlay
    if (!overlayElement) {
      overlayElement = document.createElement('div');
      overlayElement.id = 'roblox-theme-studio-overlay';
      overlayElement.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: -1 !important;
        pointer-events: none !important;
        background-color: rgba(0, 0, 0, 0.4) !important;
      `;
      document.body.insertBefore(overlayElement, document.body.firstChild);
    }
  }

  // Apply background settings
  async function applyBackground() {
    const settings = await chrome.storage.local.get([
      'enabled',
      'backgroundType',
      'backgroundData',
      'opacity',
      'blur',
      'overlay',
      'size',
      'position'
    ]);

    // If disabled or no background, remove elements
    if (!settings.enabled || !settings.backgroundData) {
      removeBackground();
      return;
    }

    createBackgroundElements();

    // Apply background
    const opacity = (settings.opacity || 60) / 100;
    const blur = settings.blur || 0;
    const overlayOpacity = (settings.overlay || 40) / 100;
    const size = settings.size || 'cover';
    const position = settings.position || 'center';

    // Handle different background types
    if (settings.backgroundType === 'video') {
      // Create video element
      let videoElement = document.getElementById('roblox-theme-studio-video');
      
      if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.id = 'roblox-theme-studio-video';
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.style.cssText = `
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          min-width: 100% !important;
          min-height: 100% !important;
          width: auto !important;
          height: auto !important;
          object-fit: cover !important;
        `;
        backgroundElement.appendChild(videoElement);
      }

      videoElement.src = settings.backgroundData;
      videoElement.play().catch(e => console.log('Video autoplay failed:', e));
      
      backgroundElement.style.backgroundImage = 'none';
    } else {
      // Remove video if exists
      const existingVideo = document.getElementById('roblox-theme-studio-video');
      if (existingVideo) {
        existingVideo.remove();
      }

      // Apply image/gradient background
      backgroundElement.style.backgroundImage = `url(${settings.backgroundData})`;
      backgroundElement.style.backgroundSize = size;
      backgroundElement.style.backgroundPosition = position;
    }

    // Apply effects
    backgroundElement.style.opacity = opacity;
    backgroundElement.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    overlayElement.style.opacity = overlayOpacity;
  }

  // Remove background
  function removeBackground() {
    if (backgroundElement) {
      backgroundElement.remove();
      backgroundElement = null;
    }
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reloadBackground') {
      applyBackground();
    }
  });

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBackground);
  } else {
    applyBackground();
  }

  // Re-apply on navigation (for single-page apps like Roblox)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(applyBackground, 500);
    }
  }).observe(document, { subtree: true, childList: true });

})();
