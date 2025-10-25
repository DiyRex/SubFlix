/**
 * SubFlix - Content Script
 * Main integration with Netflix video player
 */

// ===================================
// Global State
// ===================================

let videoElement = null;
let subtitleEngine = null;
let subtitleOverlay = null;
let settings = null;
let isInitialized = false;
let updateInterval = null;
let videoCheckInterval = null;

// ===================================
// Initialization
// ===================================

/**
 * Initialize the extension
 */
async function init() {
  if (isInitialized) {
    Utils.log('Already initialized');
    return;
  }

  Utils.log('Initializing SubFlix...');

  // Initialize components
  subtitleEngine = new SubtitleEngine();
  subtitleOverlay = new SubtitleOverlay();

  // Load settings and subtitle
  await loadSettings();
  await loadSubtitle();

  // Find video element
  await findAndAttachToVideo();

  // Start video detection polling (for SPA navigation)
  startVideoDetection();

  // Setup message listener
  setupMessageListener();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  isInitialized = true;
  Utils.log('SubFlix initialized successfully');
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const data = await StorageHelper.get(['settings'], {
      settings: {
        enabled: true,
        fontSize: 24,
        backgroundColor: 'opaque',
        backgroundOpacity: 85,
        textColor: '#FFFFFF',
        shadowEnabled: true,
        shadowStrength: 90,
        position: 'bottom',
        verticalOffset: 80,
        subtitleOffset: 0,
        showWhileSeeking: false
      }
    });

    settings = data.settings;
    subtitleEngine.setEnabled(settings.enabled);
    subtitleEngine.setOffset(settings.subtitleOffset);
    subtitleOverlay.updateSettings(settings);

    Utils.log('Settings loaded', settings);
  } catch (error) {
    Utils.error('Error loading settings', error);
  }
}

/**
 * Load subtitle from storage
 */
async function loadSubtitle() {
  try {
    const data = await StorageHelper.getLocal(['subtitle']);

    if (data.subtitle && Array.isArray(data.subtitle)) {
      subtitleEngine.loadSubtitles(data.subtitle);
      Utils.log(`Loaded ${data.subtitle.length} subtitles`);
    }
  } catch (error) {
    Utils.error('Error loading subtitle', error);
  }
}

// ===================================
// Video Detection & Attachment
// ===================================

/**
 * Find Netflix video element and attach event listeners
 */
async function findAndAttachToVideo() {
  try {
    // Try multiple selectors for Netflix video
    const selectors = [
      'video',
      '.watch-video video',
      '[data-uia="player"] video',
      '.NFPlayer video'
    ];

    for (const selector of selectors) {
      const video = document.querySelector(selector);
      if (video && video.duration > 0) {
        attachToVideo(video);
        return true;
      }
    }

    // Video not found yet, wait for it
    Utils.log('Video not found, waiting...');
    const video = await Utils.waitForElement('video', 15000);
    attachToVideo(video);
    return true;

  } catch (error) {
    Utils.error('Could not find video element', error);
    return false;
  }
}

/**
 * Attach event listeners to video element
 */
function attachToVideo(video) {
  if (videoElement === video) {
    Utils.log('Already attached to this video');
    return;
  }

  // Detach from previous video if any
  if (videoElement) {
    detachFromVideo();
  }

  videoElement = video;
  Utils.log('Attached to video element');

  // Add event listeners
  videoElement.addEventListener('play', handlePlay);
  videoElement.addEventListener('pause', handlePause);
  videoElement.addEventListener('seeked', handleSeeked);
  videoElement.addEventListener('timeupdate', handleTimeUpdate);
  videoElement.addEventListener('ended', handleEnded);

  // Check for fullscreen changes (all browser variants)
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);

  // Initialize overlay if not already done
  subtitleOverlay.init();

  // Start subtitle updates if playing
  if (!videoElement.paused) {
    startSubtitleUpdates();
  }
}

/**
 * Detach event listeners from video element
 */
function detachFromVideo() {
  if (!videoElement) return;

  videoElement.removeEventListener('play', handlePlay);
  videoElement.removeEventListener('pause', handlePause);
  videoElement.removeEventListener('seeked', handleSeeked);
  videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  videoElement.removeEventListener('ended', handleEnded);

  stopSubtitleUpdates();
  subtitleOverlay.hide();

  Utils.log('Detached from video element');
  videoElement = null;
}

/**
 * Start polling for video element (handles Netflix SPA navigation)
 */
function startVideoDetection() {
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
  }

  videoCheckInterval = setInterval(async () => {
    // Check if current video is still valid
    if (!videoElement || !document.body.contains(videoElement)) {
      Utils.log('Video element lost, searching for new one...');
      await findAndAttachToVideo();
    }

    // Repair overlay if needed
    if (subtitleOverlay) {
      subtitleOverlay.repair();
    }
  }, 2000);
}

// ===================================
// Video Event Handlers
// ===================================

function handlePlay() {
  Utils.log('Video playing');
  startSubtitleUpdates();
}

function handlePause() {
  Utils.log('Video paused');
  stopSubtitleUpdates();
}

function handleSeeked() {
  Utils.log('Video seeked to', videoElement.currentTime);

  // Reset subtitle engine cache
  subtitleEngine.currentIndex = -1;

  // Update subtitle immediately
  updateSubtitle();
}

function handleTimeUpdate() {
  // This is called very frequently, we handle updates in the interval instead
  // to avoid performance issues
}

function handleEnded() {
  Utils.log('Video ended');
  stopSubtitleUpdates();
  subtitleOverlay.hide();
}

function handleFullscreenChange() {
  const isFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  subtitleOverlay.handleFullscreen(isFullscreen);
}

// ===================================
// Subtitle Update Logic
// ===================================

/**
 * Start subtitle update interval
 */
function startSubtitleUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Update subtitles every 100ms (10 fps is sufficient)
  updateInterval = setInterval(updateSubtitle, 100);
}

/**
 * Stop subtitle update interval
 */
function stopSubtitleUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

/**
 * Update subtitle based on current video time
 */
function updateSubtitle() {
  if (!videoElement || !subtitleEngine || !subtitleOverlay) {
    return;
  }

  if (!settings.enabled || subtitleEngine.getSubtitleCount() === 0) {
    subtitleOverlay.hide();
    return;
  }

  const currentTime = videoElement.currentTime;
  const subtitle = subtitleEngine.getSubtitleAtTime(currentTime);

  if (subtitle) {
    subtitleOverlay.show(subtitle.text);
  } else {
    subtitleOverlay.hide();
  }
}

// ===================================
// Message Handling
// ===================================

/**
 * Setup message listener for popup communication
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async response
  });
}

/**
 * Handle messages from popup
 */
async function handleMessage(message, sendResponse) {
  Utils.log('Received message:', message.type);

  switch (message.type) {
    case 'CHECK_VIDEO':
      sendResponse({
        videoDetected: !!videoElement,
        videoId: Utils.getNetflixVideoId()
      });
      break;

    case 'SUBTITLE_LOADED':
      if (message.subtitle) {
        subtitleEngine.loadSubtitles(message.subtitle);
        Utils.log(`Loaded ${message.subtitle.length} subtitles`);
      }
      sendResponse({ success: true });
      break;

    case 'SUBTITLE_UNLOADED':
      subtitleEngine.clearSubtitles();
      subtitleOverlay.hide();
      Utils.log('Subtitles unloaded');
      sendResponse({ success: true });
      break;

    case 'TOGGLE_SUBTITLES':
      settings.enabled = message.enabled;
      subtitleEngine.setEnabled(message.enabled);
      if (!message.enabled) {
        subtitleOverlay.hide();
      }
      Utils.log(`Subtitles ${message.enabled ? 'enabled' : 'disabled'}`);
      sendResponse({ success: true });
      break;

    case 'OFFSET_CHANGED':
      settings.subtitleOffset = message.offset;
      subtitleEngine.setOffset(message.offset);
      updateSubtitle(); // Immediate update
      Utils.log(`Offset changed to ${message.offset}s`);
      sendResponse({ success: true });
      break;

    case 'SETTINGS_UPDATED':
      settings = { ...settings, ...message.settings };
      subtitleEngine.setEnabled(settings.enabled);
      subtitleEngine.setOffset(settings.subtitleOffset);
      subtitleOverlay.updateSettings(settings);
      Utils.log('Settings updated');
      sendResponse({ success: true });
      break;

    case 'TEST_SUBTITLE':
      subtitleOverlay.showTestSubtitle();
      sendResponse({ success: true });
      break;

    default:
      Utils.log('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

// ===================================
// Keyboard Shortcuts
// ===================================

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyboardShortcut);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcut(e) {
  // Only trigger if Ctrl is pressed (Cmd on Mac)
  if (!(e.ctrlKey || e.metaKey)) return;

  let handled = false;

  switch (e.key) {
    case 'S':
      // Ctrl+Shift+S: Toggle subtitles
      if (e.shiftKey) {
        settings.enabled = !settings.enabled;
        subtitleEngine.setEnabled(settings.enabled);
        if (!settings.enabled) {
          subtitleOverlay.hide();
        }
        StorageHelper.set({ settings });
        Utils.log(`Subtitles toggled: ${settings.enabled}`);
        handled = true;
      }
      break;

    case 'ArrowRight':
      // Ctrl+Right: +0.5s delay
      adjustOffsetFromKeyboard(0.5);
      handled = true;
      break;

    case 'ArrowLeft':
      // Ctrl+Left: -0.5s delay
      adjustOffsetFromKeyboard(-0.5);
      handled = true;
      break;

    case 'ArrowUp':
      // Ctrl+Up: Increase font size
      adjustFontSize(2);
      handled = true;
      break;

    case 'ArrowDown':
      // Ctrl+Down: Decrease font size
      adjustFontSize(-2);
      handled = true;
      break;

    case '0':
      // Ctrl+0: Reset delay
      settings.subtitleOffset = 0;
      subtitleEngine.setOffset(0);
      StorageHelper.set({ settings });
      updateSubtitle();
      Utils.log('Offset reset to 0');
      handled = true;
      break;
  }

  if (handled) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * Adjust subtitle offset from keyboard
 */
function adjustOffsetFromKeyboard(delta) {
  settings.subtitleOffset += delta;
  settings.subtitleOffset = Math.round(settings.subtitleOffset * 10) / 10;
  subtitleEngine.setOffset(settings.subtitleOffset);
  StorageHelper.set({ settings });
  updateSubtitle();
  Utils.log(`Offset adjusted to ${settings.subtitleOffset}s`);
}

/**
 * Adjust font size from keyboard
 */
function adjustFontSize(delta) {
  settings.fontSize = Math.max(12, Math.min(48, settings.fontSize + delta));
  subtitleOverlay.updateSettings(settings);
  StorageHelper.set({ settings });
  Utils.log(`Font size adjusted to ${settings.fontSize}px`);
}

// ===================================
// Cleanup
// ===================================

/**
 * Cleanup when page unloads
 */
window.addEventListener('beforeunload', () => {
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
  }

  stopSubtitleUpdates();
  detachFromVideo();

  if (subtitleOverlay) {
    subtitleOverlay.destroy();
  }
});

// ===================================
// Start Extension
// ===================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also initialize after a short delay to handle dynamic content
setTimeout(init, 2000);

Utils.log('SubFlix content script loaded');
