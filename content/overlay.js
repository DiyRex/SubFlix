/**
 * SubFlix - Subtitle Overlay Manager
 * Handles visual display of subtitles on Netflix video player
 */

class SubtitleOverlay {
  constructor() {
    this.container = null;
    this.textElement = null;
    this.currentText = '';
    this.isVisible = false;
    this.settings = this._getDefaultSettings();
    this.overlayId = 'subflix-subtitle-overlay';
  }

  /**
   * Get default settings
   * @private
   */
  _getDefaultSettings() {
    return {
      fontSize: 24,
      backgroundColor: 'opaque',
      backgroundOpacity: 85,
      textColor: '#FFFFFF',
      shadowEnabled: true,
      shadowStrength: 90,
      position: 'bottom',
      verticalOffset: 80
    };
  }

  /**
   * Initialize and inject subtitle overlay into page
   */
  init() {
    if (this.container) {
      Utils.log('Overlay already initialized');
      return;
    }

    this._createOverlay();
    this._injectStyles();
    Utils.log('Subtitle overlay initialized');
  }

  /**
   * Create overlay DOM elements
   * @private
   */
  _createOverlay() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = this.overlayId;
    this.container.className = 'subflix-subtitle-container';

    // Create text element
    this.textElement = document.createElement('div');
    this.textElement.className = 'subflix-subtitle-text';

    this.container.appendChild(this.textElement);
    document.body.appendChild(this.container);

    // Apply initial settings
    this._applySettings();
  }

  /**
   * Inject CSS styles for overlay
   * @private
   */
  _injectStyles() {
    const styleId = 'subflix-overlay-styles';

    // Remove existing styles if any
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .subflix-subtitle-container {
        position: fixed;
        left: 0;
        right: 0;
        z-index: 999999;
        pointer-events: none;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: opacity 0.2s ease;
      }

      .subflix-subtitle-container.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .subflix-subtitle-text {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 4px;
        text-align: center;
        line-height: 1.4;
        max-width: 80%;
        word-wrap: break-word;
        white-space: pre-wrap;
        transition: all 0.15s ease;
      }

      /* Position variants */
      .subflix-subtitle-container.position-top {
        top: 0;
      }

      .subflix-subtitle-container.position-middle {
        top: 50%;
        transform: translateY(-50%);
      }

      .subflix-subtitle-container.position-bottom {
        bottom: 0;
      }

      /* Fade in/out animation */
      @keyframes subflixFadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .subflix-subtitle-text.fade-in {
        animation: subflixFadeIn 0.2s ease;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Show subtitle text
   * @param {string} text - Subtitle text to display
   */
  show(text) {
    if (!this.container || !this.textElement) {
      this.init();
    }

    // Sanitize and set text
    const sanitizedText = Utils.sanitizeSubtitleText(text);

    if (this.currentText !== sanitizedText) {
      this.currentText = sanitizedText;
      this.textElement.innerHTML = sanitizedText;
      this.textElement.classList.add('fade-in');

      setTimeout(() => {
        this.textElement.classList.remove('fade-in');
      }, 200);
    }

    if (!this.isVisible) {
      this.container.classList.remove('hidden');
      this.isVisible = true;
    }
  }

  /**
   * Hide subtitle
   */
  hide() {
    if (!this.container) return;

    if (this.isVisible) {
      this.container.classList.add('hidden');
      this.isVisible = false;
      this.currentText = '';
    }
  }

  /**
   * Update settings and apply them
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this._applySettings();
  }

  /**
   * Apply current settings to overlay
   * @private
   */
  _applySettings() {
    if (!this.container || !this.textElement) return;

    const { fontSize, backgroundColor, backgroundOpacity, textColor, shadowEnabled, shadowStrength, position, verticalOffset } = this.settings;

    // Apply font size
    this.textElement.style.fontSize = `${fontSize}px`;

    // Apply text color
    this.textElement.style.color = textColor;

    // Apply background
    let bgColor = 'transparent';
    const opacity = backgroundOpacity / 100;

    switch (backgroundColor) {
      case 'transparent':
        bgColor = `rgba(0, 0, 0, ${opacity * 0.3})`;
        break;
      case 'semi':
        bgColor = `rgba(0, 0, 0, ${opacity * 0.6})`;
        break;
      case 'opaque':
        bgColor = `rgba(0, 0, 0, ${opacity})`;
        break;
      case 'none':
        bgColor = 'transparent';
        break;
    }

    this.textElement.style.backgroundColor = bgColor;

    // Apply text shadow
    if (shadowEnabled) {
      const shadowOpacity = shadowStrength / 100 * 0.9;
      this.textElement.style.textShadow = `2px 2px 4px rgba(0, 0, 0, ${shadowOpacity}),
                                           -1px -1px 2px rgba(0, 0, 0, ${shadowOpacity * 0.5})`;
    } else {
      this.textElement.style.textShadow = 'none';
    }

    // Apply position
    this.container.className = `subflix-subtitle-container position-${position}`;
    if (this.isVisible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }

    // Apply vertical offset
    switch (position) {
      case 'top':
        this.container.style.top = `${verticalOffset}px`;
        this.container.style.bottom = 'auto';
        this.container.style.transform = 'none';
        break;
      case 'middle':
        this.container.style.top = '50%';
        this.container.style.bottom = 'auto';
        this.container.style.transform = `translateY(calc(-50% + ${verticalOffset}px))`;
        break;
      case 'bottom':
        this.container.style.bottom = `${verticalOffset}px`;
        this.container.style.top = 'auto';
        this.container.style.transform = 'none';
        break;
    }
  }

  /**
   * Toggle subtitle visibility
   * @param {boolean} visible
   */
  setVisible(visible) {
    if (visible) {
      if (this.currentText) {
        this.show(this.currentText);
      }
    } else {
      this.hide();
    }
  }

  /**
   * Check if overlay is currently visible
   * @returns {boolean}
   */
  isOverlayVisible() {
    return this.isVisible;
  }

  /**
   * Get current displayed text
   * @returns {string}
   */
  getCurrentText() {
    return this.currentText;
  }

  /**
   * Destroy overlay and remove from DOM
   */
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.textElement = null;
      this.currentText = '';
      this.isVisible = false;
    }

    // Remove injected styles
    const style = document.getElementById('subflix-overlay-styles');
    if (style) {
      style.remove();
    }

    Utils.log('Subtitle overlay destroyed');
  }

  /**
   * Reset overlay to default state
   */
  reset() {
    this.hide();
    this.currentText = '';
    this.settings = this._getDefaultSettings();
    this._applySettings();
  }

  /**
   * Adjust overlay for fullscreen mode
   * @param {boolean} isFullscreen
   */
  handleFullscreen(isFullscreen) {
    if (!this.container) return;

    if (isFullscreen) {
      // Find the fullscreen element
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (fullscreenElement) {
        // Store visibility state
        const wasVisible = this.isVisible;

        // Move overlay inside fullscreen element
        fullscreenElement.appendChild(this.container);

        // Increase z-index for fullscreen
        this.container.style.zIndex = '9999999';

        // Restore visibility if needed
        if (wasVisible) {
          this.container.classList.remove('hidden');
        }

        Utils.log('Subtitle overlay moved to fullscreen element');
      }
    } else {
      // Move overlay back to body when exiting fullscreen
      if (this.container.parentElement !== document.body) {
        const wasVisible = this.isVisible;

        document.body.appendChild(this.container);
        this.container.style.zIndex = '999999';

        // Restore visibility if needed
        if (wasVisible) {
          this.container.classList.remove('hidden');
        }

        Utils.log('Subtitle overlay moved back to body');
      }
    }
  }

  /**
   * Test subtitle display
   * Shows a test subtitle for 3 seconds
   */
  showTestSubtitle() {
    const testText = 'SubFlix Test Subtitle\nදෙවන පේළිය / Second Line\n第三行';
    this.show(testText);

    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Check if overlay exists and is healthy
   * @returns {boolean}
   */
  isHealthy() {
    return (
      this.container &&
      this.textElement &&
      document.body.contains(this.container)
    );
  }

  /**
   * Repair overlay if it was removed from DOM
   */
  repair() {
    if (!this.isHealthy()) {
      Utils.log('Overlay unhealthy, reinitializing...');
      this.container = null;
      this.textElement = null;
      this.init();
      return true;
    }
    return false;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SubtitleOverlay = SubtitleOverlay;
}
