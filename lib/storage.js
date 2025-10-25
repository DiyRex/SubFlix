/**
 * SubFlix - Storage Helper
 * Handles all chrome.storage operations with fallbacks and error handling
 */

const StorageHelper = {
  /**
   * Get data from chrome.storage.sync with fallback to local
   */
  async get(keys, defaultValues = {}) {
    try {
      // Try sync storage first
      const data = await new Promise((resolve, reject) => {
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });

      // Merge with defaults
      return { ...defaultValues, ...data };
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);

      // Fallback to local storage
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve({ ...defaultValues, ...result });
          }
        });
      });
    }
  },

  /**
   * Set data to chrome.storage.sync with fallback to local
   */
  async set(data) {
    try {
      return await new Promise((resolve, reject) => {
        chrome.storage.sync.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);

      return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }
  },

  /**
   * Get data from local storage only (for large data like subtitles)
   */
  async getLocal(keys, defaultValues = {}) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ ...defaultValues, ...result });
        }
      });
    });
  },

  /**
   * Set data to local storage only
   */
  async setLocal(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Remove items from storage
   */
  async remove(keys, useLocal = false) {
    const storage = useLocal ? chrome.storage.local : chrome.storage.sync;

    return new Promise((resolve, reject) => {
      storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Clear all storage
   */
  async clear(clearLocal = false) {
    const promises = [
      new Promise((resolve) => chrome.storage.sync.clear(resolve))
    ];

    if (clearLocal) {
      promises.push(
        new Promise((resolve) => chrome.storage.local.clear(resolve))
      );
    }

    return Promise.all(promises);
  },

  /**
   * Get storage usage stats
   */
  async getStats() {
    const stats = {
      sync: { used: 0, quota: chrome.storage.sync.QUOTA_BYTES },
      local: { used: 0, quota: chrome.storage.local.QUOTA_BYTES }
    };

    try {
      stats.sync.used = await new Promise((resolve) => {
        chrome.storage.sync.getBytesInUse(null, resolve);
      });
    } catch (error) {
      console.error('Error getting sync storage stats:', error);
    }

    try {
      stats.local.used = await new Promise((resolve) => {
        chrome.storage.local.getBytesInUse(null, resolve);
      });
    } catch (error) {
      console.error('Error getting local storage stats:', error);
    }

    return stats;
  }
};

// Make available globally in content scripts
if (typeof window !== 'undefined') {
  window.StorageHelper = StorageHelper;
}
