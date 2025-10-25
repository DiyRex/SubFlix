/**
 * SubFlix - Subtitle Engine
 * Handles SRT parsing, subtitle synchronization, and timing
 */

class SubtitleEngine {
  constructor() {
    this.subtitles = [];
    this.currentIndex = -1;
    this.offset = 0;
    this.enabled = true;
    this.lastUpdateTime = 0;
  }

  /**
   * Parse SRT file content into subtitle array
   * @param {string} content - Raw SRT file content
   * @returns {Array} Array of subtitle objects
   */
  parseSRT(content) {
    const subtitles = [];
    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      try {
        // Line 0: Sequence number (optional, we don't use it)
        // Line 1: Timestamp
        const timeMatch = lines[1].match(
          /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
        );

        if (!timeMatch) {
          console.warn('Invalid timestamp format:', lines[1]);
          continue;
        }

        const startTime = this._parseTimestamp(
          timeMatch[1],
          timeMatch[2],
          timeMatch[3],
          timeMatch[4]
        );

        const endTime = this._parseTimestamp(
          timeMatch[5],
          timeMatch[6],
          timeMatch[7],
          timeMatch[8]
        );

        // Lines 2+: Subtitle text (can be multi-line)
        const text = lines.slice(2).join('\n').trim();

        if (text) {
          subtitles.push({
            start: startTime,
            end: endTime,
            text: text
          });
        }
      } catch (error) {
        console.error('Error parsing subtitle block:', block, error);
      }
    }

    Utils.log(`Parsed ${subtitles.length} subtitles from SRT`);
    return subtitles;
  }

  /**
   * Parse timestamp string to seconds
   * @private
   */
  _parseTimestamp(hours, minutes, seconds, milliseconds) {
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(milliseconds) / 1000
    );
  }

  /**
   * Load subtitles into the engine
   * @param {Array} subtitles - Array of subtitle objects
   */
  loadSubtitles(subtitles) {
    if (!Array.isArray(subtitles)) {
      throw new Error('Subtitles must be an array');
    }

    this.subtitles = subtitles;
    this.currentIndex = -1;
    Utils.log(`Loaded ${subtitles.length} subtitles into engine`);
  }

  /**
   * Clear all loaded subtitles
   */
  clearSubtitles() {
    this.subtitles = [];
    this.currentIndex = -1;
    Utils.log('Cleared all subtitles');
  }

  /**
   * Get subtitle for current video time
   * Uses optimized search algorithm with caching
   * @param {number} currentTime - Current video time in seconds
   * @returns {Object|null} Subtitle object or null
   */
  getSubtitleAtTime(currentTime) {
    if (!this.enabled || !this.subtitles || this.subtitles.length === 0) {
      return null;
    }

    const adjustedTime = currentTime + this.offset;

    // Optimization: Check if current subtitle is still valid
    if (this.currentIndex >= 0 && this.currentIndex < this.subtitles.length) {
      const current = this.subtitles[this.currentIndex];
      if (adjustedTime >= current.start && adjustedTime <= current.end) {
        return current;
      }
    }

    // Check next subtitle (common case when video is playing)
    if (this.currentIndex + 1 < this.subtitles.length) {
      const next = this.subtitles[this.currentIndex + 1];
      if (adjustedTime >= next.start && adjustedTime <= next.end) {
        this.currentIndex++;
        return next;
      }
    }

    // Check previous subtitle (in case of slight timing mismatch)
    if (this.currentIndex - 1 >= 0) {
      const prev = this.subtitles[this.currentIndex - 1];
      if (adjustedTime >= prev.start && adjustedTime <= prev.end) {
        this.currentIndex--;
        return prev;
      }
    }

    // Not found in nearby range, do binary search
    const result = this._binarySearchSubtitle(adjustedTime);
    if (result) {
      this.currentIndex = result.index;
      return result.subtitle;
    }

    return null;
  }

  /**
   * Binary search for subtitle at given time
   * @private
   * @param {number} time - Time in seconds
   * @returns {Object|null} Object with subtitle and index, or null
   */
  _binarySearchSubtitle(time) {
    let left = 0;
    let right = this.subtitles.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const subtitle = this.subtitles[mid];

      if (time >= subtitle.start && time <= subtitle.end) {
        return { subtitle, index: mid };
      } else if (time < subtitle.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return null;
  }

  /**
   * Find all subtitles in a time range
   * @param {number} startTime - Range start in seconds
   * @param {number} endTime - Range end in seconds
   * @returns {Array} Array of subtitles in range
   */
  getSubtitlesInRange(startTime, endTime) {
    const adjustedStart = startTime + this.offset;
    const adjustedEnd = endTime + this.offset;

    return this.subtitles.filter(
      sub => sub.start <= adjustedEnd && sub.end >= adjustedStart
    );
  }

  /**
   * Set subtitle timing offset
   * @param {number} offset - Offset in seconds (can be negative)
   */
  setOffset(offset) {
    this.offset = offset;
    this.currentIndex = -1; // Reset cache
    Utils.log(`Subtitle offset set to ${offset}s`);
  }

  /**
   * Get current offset
   * @returns {number} Current offset in seconds
   */
  getOffset() {
    return this.offset;
  }

  /**
   * Enable/disable subtitle display
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    Utils.log(`Subtitles ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if subtitles are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get subtitle count
   * @returns {number}
   */
  getSubtitleCount() {
    return this.subtitles.length;
  }

  /**
   * Get subtitle by index
   * @param {number} index
   * @returns {Object|null}
   */
  getSubtitleByIndex(index) {
    if (index >= 0 && index < this.subtitles.length) {
      return this.subtitles[index];
    }
    return null;
  }

  /**
   * Get total duration of subtitles
   * @returns {number} Duration in seconds
   */
  getTotalDuration() {
    if (this.subtitles.length === 0) return 0;
    const lastSubtitle = this.subtitles[this.subtitles.length - 1];
    return lastSubtitle.end;
  }

  /**
   * Validate subtitle data structure
   * @param {Array} subtitles
   * @returns {boolean}
   */
  validateSubtitles(subtitles) {
    if (!Array.isArray(subtitles)) return false;
    if (subtitles.length === 0) return false;

    for (const sub of subtitles) {
      if (
        typeof sub.start !== 'number' ||
        typeof sub.end !== 'number' ||
        typeof sub.text !== 'string' ||
        sub.start < 0 ||
        sub.end <= sub.start
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get statistics about loaded subtitles
   * @returns {Object}
   */
  getStats() {
    if (this.subtitles.length === 0) {
      return {
        count: 0,
        duration: 0,
        averageLength: 0,
        longestText: '',
        offset: this.offset
      };
    }

    const totalLength = this.subtitles.reduce((sum, sub) => sum + sub.text.length, 0);
    const longest = this.subtitles.reduce(
      (max, sub) => (sub.text.length > max.text.length ? sub : max),
      this.subtitles[0]
    );

    return {
      count: this.subtitles.length,
      duration: this.getTotalDuration(),
      averageLength: Math.round(totalLength / this.subtitles.length),
      longestText: longest.text.substring(0, 50) + '...',
      offset: this.offset,
      enabled: this.enabled
    };
  }

  /**
   * Export subtitles back to SRT format
   * @returns {string} SRT formatted string
   */
  exportToSRT() {
    let srtContent = '';

    this.subtitles.forEach((sub, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${this._formatTimestamp(sub.start)} --> ${this._formatTimestamp(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    return srtContent.trim();
  }

  /**
   * Format seconds to SRT timestamp format
   * @private
   */
  _formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Reset engine to initial state
   */
  reset() {
    this.subtitles = [];
    this.currentIndex = -1;
    this.offset = 0;
    this.enabled = true;
    this.lastUpdateTime = 0;
    Utils.log('Subtitle engine reset');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SubtitleEngine = SubtitleEngine;
}
