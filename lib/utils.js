/**
 * SubFlix - Common Utility Functions
 * Shared utilities used across the extension
 */

const Utils = {
  /**
   * Parse SRT timestamp to seconds
   * Format: HH:MM:SS,mmm
   */
  parseTimestamp(hours, minutes, seconds, milliseconds) {
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(milliseconds) / 1000
    );
  },

  /**
   * Format seconds to HH:MM:SS,mmm format
   */
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  },

  /**
   * Format seconds to human-readable time
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Sanitize subtitle text (preserve line breaks, escape HTML)
   */
  sanitizeSubtitleText(text) {
    return text
      .split('\n')
      .map(line => this.escapeHtml(line))
      .join('<br>');
  },

  /**
   * Debounce function execution
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function execution
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Binary search for subtitle at specific time
   * More efficient than linear search for large subtitle files
   */
  findSubtitleAtTime(subtitles, currentTime, offset = 0) {
    if (!subtitles || subtitles.length === 0) return null;

    const adjustedTime = currentTime + offset;

    // Binary search for first subtitle that might match
    let left = 0;
    let right = subtitles.length - 1;
    let result = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const subtitle = subtitles[mid];

      if (adjustedTime >= subtitle.start && adjustedTime <= subtitle.end) {
        return subtitle;
      } else if (adjustedTime < subtitle.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return null;
  },

  /**
   * Find subtitle index at time (for caching optimization)
   */
  findSubtitleIndexAtTime(subtitles, currentTime, offset = 0, lastIndex = 0) {
    if (!subtitles || subtitles.length === 0) return -1;

    const adjustedTime = currentTime + offset;

    // Start search from last known index for better performance
    const startIndex = Math.max(0, lastIndex - 5);
    const endIndex = Math.min(subtitles.length, lastIndex + 10);

    for (let i = startIndex; i < endIndex; i++) {
      const subtitle = subtitles[i];
      if (adjustedTime >= subtitle.start && adjustedTime <= subtitle.end) {
        return i;
      }
    }

    // If not found in nearby range, do full binary search
    return subtitles.findIndex(sub =>
      adjustedTime >= sub.start && adjustedTime <= sub.end
    );
  },

  /**
   * Get Netflix video ID from URL or page
   */
  getNetflixVideoId() {
    // Try to get from URL
    const urlMatch = window.location.pathname.match(/\/watch\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Try to get from video player metadata
    try {
      const videoPlayer = document.querySelector('.watch-video');
      if (videoPlayer) {
        const videoId = videoPlayer.getAttribute('data-videoid');
        if (videoId) return videoId;
      }
    } catch (error) {
      console.error('Error extracting video ID:', error);
    }

    return null;
  },

  /**
   * Check if current page is Netflix video page
   */
  isNetflixVideoPage() {
    return (
      window.location.hostname.includes('netflix.com') &&
      window.location.pathname.includes('/watch/')
    );
  },

  /**
   * Wait for element to appear in DOM
   */
  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return `subflix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Check if browser supports required APIs
   */
  checkBrowserSupport() {
    const required = {
      chrome: typeof chrome !== 'undefined',
      storage: typeof chrome !== 'undefined' && chrome.storage,
      runtime: typeof chrome !== 'undefined' && chrome.runtime,
      tabs: typeof chrome !== 'undefined' && chrome.tabs
    };

    const unsupported = Object.keys(required).filter(key => !required[key]);

    return {
      supported: unsupported.length === 0,
      missing: unsupported
    };
  },

  /**
   * Log with timestamp
   */
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[SubFlix ${timestamp}]`, message, data);
    } else {
      console.log(`[SubFlix ${timestamp}]`, message);
    }
  },

  /**
   * Error logging
   */
  error(message, error = null) {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[SubFlix ${timestamp}]`, message, error);
    } else {
      console.error(`[SubFlix ${timestamp}]`, message);
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
