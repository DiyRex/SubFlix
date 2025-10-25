/**
 * SubFlix - Background Service Worker
 * Handles extension lifecycle events and background tasks
 */

// ===================================
// Installation & Updates
// ===================================

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[SubFlix] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension updated
    handleUpdate(details.previousVersion);
  }

  // Setup context menu after installation
  setTimeout(() => {
    setupContextMenu();
  }, 100);
});

/**
 * Handle service worker startup (when already installed)
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[SubFlix] Service worker starting up');
  setTimeout(() => {
    setupContextMenu();
  }, 100);
});

/**
 * Handle first installation
 */
function handleFirstInstall() {
  console.log('[SubFlix] First installation - setting up defaults');

  // Set default settings
  const defaultSettings = {
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
    autoLoadLast: false,
    rememberDelayPerVideo: true,
    showWhileSeeking: false
  };

  chrome.storage.sync.set({ settings: defaultSettings }, () => {
    console.log('[SubFlix] Default settings saved');
  });

  // Open welcome page (optional)
  // chrome.tabs.create({ url: 'https://github.com/yourusername/subflix' });
}

/**
 * Handle extension update
 */
function handleUpdate(previousVersion) {
  console.log(`[SubFlix] Updated from ${previousVersion}`);

  // Migration logic for future versions
  // Example: Migrate old settings format to new format
}

// ===================================
// Message Handling
// ===================================

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SubFlix] Background received message:', message.type);

  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true; // Keep channel open

    case 'SAVE_SETTINGS':
      handleSaveSettings(message.settings, sendResponse);
      return true;

    case 'GET_SUBTITLE':
      handleGetSubtitle(sendResponse);
      return true;

    case 'LOG':
      // Allow content scripts to log to background console
      console.log('[SubFlix Content]', message.message, message.data);
      sendResponse({ success: true });
      break;

    default:
      console.log('[SubFlix] Unknown message type:', message.type);
  }

  return false;
});

/**
 * Get settings from storage
 */
function handleGetSettings(sendResponse) {
  chrome.storage.sync.get(['settings'], (result) => {
    sendResponse({ settings: result.settings || null });
  });
}

/**
 * Save settings to storage
 */
function handleSaveSettings(settings, sendResponse) {
  chrome.storage.sync.set({ settings }, () => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError });
    } else {
      sendResponse({ success: true });
      // Notify all tabs about settings change
      notifyAllTabs({ type: 'SETTINGS_UPDATED', settings });
    }
  });
}

/**
 * Get subtitle from storage
 */
function handleGetSubtitle(sendResponse) {
  chrome.storage.local.get(['subtitle', 'subtitleMetadata'], (result) => {
    sendResponse({
      subtitle: result.subtitle || null,
      metadata: result.subtitleMetadata || null
    });
  });
}

// ===================================
// Tab Communication
// ===================================

/**
 * Notify all Netflix tabs about an event
 */
function notifyAllTabs(message) {
  chrome.tabs.query({ url: 'https://www.netflix.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        // Ignore errors (tab might not have content script yet)
        if (chrome.runtime.lastError) {
          // Silently ignore
        }
      });
    });
  });
}

// ===================================
// Context Menu (Optional)
// ===================================

/**
 * Create context menu items
 */
function setupContextMenu() {
  // Check if contextMenus API is available
  if (!chrome.contextMenus) {
    console.log('[SubFlix] Context menus not available');
    return;
  }

  try {
    chrome.contextMenus.removeAll(() => {
      // Double-check API is still available in callback
      if (!chrome.contextMenus || !chrome.contextMenus.create) {
        console.log('[SubFlix] Context menu API not available in callback');
        return;
      }

      try {
        chrome.contextMenus.create({
          id: 'subflix-toggle',
          title: 'Toggle SubFlix Subtitles',
          contexts: ['page'],
          documentUrlPatterns: ['https://www.netflix.com/*']
        });

        chrome.contextMenus.create({
          id: 'subflix-upload',
          title: 'Upload Subtitle File',
          contexts: ['page'],
          documentUrlPatterns: ['https://www.netflix.com/*']
        });

        console.log('[SubFlix] Context menus created');
      } catch (err) {
        console.error('[SubFlix] Error in context menu create:', err);
      }
    });
  } catch (error) {
    console.error('[SubFlix] Error creating context menus:', error);
  }
}

/**
 * Handle context menu clicks
 */
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case 'subflix-toggle':
        // Toggle subtitles
        chrome.storage.sync.get(['settings'], (result) => {
          const settings = result.settings || {};
          settings.enabled = !settings.enabled;
          chrome.storage.sync.set({ settings }, () => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_SUBTITLES',
              enabled: settings.enabled
            });
          });
        });
        break;

      case 'subflix-upload':
        // Open popup (can't directly upload from background)
        chrome.action.openPopup();
        break;
    }
  });
}

// Context menu setup is called from onInstalled listener above
// This ensures the API is ready before we try to use it

// ===================================
// Storage Management
// ===================================

/**
 * Monitor storage usage and cleanup if needed
 */
function checkStorageQuota() {
  if (!chrome.storage || !chrome.storage.local) {
    return;
  }

  try {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      if (chrome.runtime.lastError) {
        console.error('[SubFlix] Error checking storage:', chrome.runtime.lastError);
        return;
      }

      const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      const usagePercent = (bytesInUse / quota) * 100;

      console.log(`[SubFlix] Storage usage: ${usagePercent.toFixed(2)}% (${bytesInUse} / ${quota} bytes)`);

      if (usagePercent > 80) {
        console.warn('[SubFlix] Storage usage high, consider cleanup');
        // Could notify user or auto-cleanup old data
      }
    });
  } catch (error) {
    console.error('[SubFlix] Error in checkStorageQuota:', error);
  }
}

// Note: Using chrome.alarms for periodic checks instead of setInterval
// (setInterval doesn't work reliably in service workers)

// ===================================
// Alarm/Periodic Tasks (Optional)
// ===================================

/**
 * Setup periodic tasks using chrome.alarms
 */
if (chrome.alarms) {
  try {
    chrome.alarms.create('storage-check', {
      periodInMinutes: 60 // Check every hour
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'storage-check') {
        checkStorageQuota();
      }
    });

    console.log('[SubFlix] Periodic alarms configured');
  } catch (error) {
    console.error('[SubFlix] Error setting up alarms:', error);
  }
} else {
  console.log('[SubFlix] Alarms API not available');
}

// ===================================
// Extension Icon Badge
// ===================================

/**
 * Update extension icon badge
 */
function updateBadge(text, color) {
  if (!chrome.action) {
    return;
  }

  try {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('[SubFlix] Error updating badge:', error);
  }
}

// Listen for subtitle load events to update badge
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.subtitle) {
    if (changes.subtitle.newValue) {
      // Subtitle loaded
      updateBadge('ON', '#46D369');
    } else {
      // Subtitle unloaded
      updateBadge('', '#666666');
    }
  }

  if (areaName === 'sync' && changes.settings) {
    const newSettings = changes.settings.newValue;
    if (newSettings && !newSettings.enabled) {
      updateBadge('OFF', '#666666');
    } else if (newSettings && newSettings.enabled) {
      // Check if subtitle is loaded
      chrome.storage.local.get(['subtitle'], (result) => {
        if (result.subtitle) {
          updateBadge('ON', '#46D369');
        } else {
          updateBadge('', '#666666');
        }
      });
    }
  }
});

// Initialize badge on startup
chrome.storage.local.get(['subtitle'], (result) => {
  if (result.subtitle) {
    updateBadge('ON', '#46D369');
  }
});

// ===================================
// Error Handling
// ===================================

/**
 * Global error handler
 */
self.addEventListener('error', (event) => {
  console.error('[SubFlix] Background error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SubFlix] Unhandled promise rejection:', event.reason);
});

// ===================================
// Initialization
// ===================================

console.log('[SubFlix] Background service worker initialized');
