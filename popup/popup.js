/**
 * SubFlix - Custom Netflix Subtitles
 * Popup UI Controller
 */

// ===================================
// State Management
// ===================================

let currentSettings = {
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

let currentSubtitle = null;
let currentVideoId = null;

// ===================================
// DOM Elements
// ===================================

const elements = {
  // Status
  masterToggle: document.getElementById('masterToggle'),
  extensionStatus: document.getElementById('extensionStatus'),
  videoStatus: document.getElementById('videoStatus'),
  subtitleStatus: document.getElementById('subtitleStatus'),

  // File management
  uploadBtn: document.getElementById('uploadBtn'),
  unloadBtn: document.getElementById('unloadBtn'),
  fileInput: document.getElementById('fileInput'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  fileDetails: document.getElementById('fileDetails'),

  // Timing controls
  offsetValue: document.getElementById('offsetValue'),
  timingButtons: document.querySelectorAll('.btn-timing'),
  resetTimingBtn: document.getElementById('resetTimingBtn'),

  // Appearance
  fontSizeSlider: document.getElementById('fontSizeSlider'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  backgroundRadios: document.querySelectorAll('input[name="background"]'),
  opacitySlider: document.getElementById('opacitySlider'),
  opacityValue: document.getElementById('opacityValue'),
  textColorPicker: document.getElementById('textColorPicker'),
  textColorHex: document.getElementById('textColorHex'),
  shadowToggle: document.getElementById('shadowToggle'),
  shadowSlider: document.getElementById('shadowSlider'),
  shadowValue: document.getElementById('shadowValue'),
  shadowStrengthGroup: document.getElementById('shadowStrengthGroup'),
  positionSelect: document.getElementById('positionSelect'),
  verticalOffsetSlider: document.getElementById('verticalOffsetSlider'),
  verticalOffsetValue: document.getElementById('verticalOffsetValue'),
  previewText: document.getElementById('previewText'),

  // Advanced settings
  autoLoadToggle: document.getElementById('autoLoadToggle'),
  rememberDelayToggle: document.getElementById('rememberDelayToggle'),
  showWhileSeekingToggle: document.getElementById('showWhileSeekingToggle'),
  testSubtitleBtn: document.getElementById('testSubtitleBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),

  // Toast
  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMessage: document.getElementById('toastMessage')
};

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadSubtitleStatus();
  await checkVideoStatus();
  initializeEventListeners();
  updateUIFromSettings();
  updatePreview();
});

/**
 * Load settings from chrome.storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        currentSettings = { ...currentSettings, ...result.settings };
      }
      resolve();
    });
  });
}

/**
 * Save settings to chrome.storage
 */
async function saveSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings: currentSettings }, () => {
      resolve();
    });
  });
}

/**
 * Load subtitle status from storage
 */
async function loadSubtitleStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['subtitle', 'subtitleMetadata'], (result) => {
      if (result.subtitle) {
        currentSubtitle = result.subtitle;
        const metadata = result.subtitleMetadata || {};
        updateSubtitleStatus(true, metadata);
      }
      resolve();
    });
  });
}

/**
 * Check if Netflix video is detected
 */
async function checkVideoStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('netflix.com')) {
      updateVideoStatus(false, 'Not on Netflix');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'CHECK_VIDEO' }, (response) => {
      if (chrome.runtime.lastError) {
        updateVideoStatus(false, 'Reload page');
        return;
      }

      if (response && response.videoDetected) {
        updateVideoStatus(true, 'Detected');
        currentVideoId = response.videoId;

        // Load video-specific delay if enabled
        if (currentSettings.rememberDelayPerVideo && currentVideoId) {
          loadVideoDelay(currentVideoId);
        }
      } else {
        updateVideoStatus(false, 'No video playing');
      }
    });
  } catch (error) {
    console.error('Error checking video status:', error);
    updateVideoStatus(false, 'Error');
  }
}

/**
 * Load delay setting for specific video
 */
function loadVideoDelay(videoId) {
  chrome.storage.local.get([`delay_${videoId}`], (result) => {
    if (result[`delay_${videoId}`] !== undefined) {
      currentSettings.subtitleOffset = result[`delay_${videoId}`];
      updateOffsetDisplay();
    }
  });
}

/**
 * Save delay setting for specific video
 */
function saveVideoDelay(videoId, offset) {
  if (currentSettings.rememberDelayPerVideo && videoId) {
    chrome.storage.local.set({ [`delay_${videoId}`]: offset });
  }
}

// ===================================
// Event Listeners
// ===================================

function initializeEventListeners() {
  // Master toggle
  elements.masterToggle.addEventListener('change', handleMasterToggle);

  // File management
  elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileUpload);
  elements.unloadBtn.addEventListener('click', handleUnload);

  // Timing controls
  elements.timingButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const offset = parseFloat(e.currentTarget.dataset.offset);
      adjustOffset(offset);
    });
  });
  elements.resetTimingBtn.addEventListener('click', resetTiming);

  // Appearance controls
  elements.fontSizeSlider.addEventListener('input', handleFontSizeChange);
  elements.backgroundRadios.forEach(radio => {
    radio.addEventListener('change', handleBackgroundChange);
  });
  elements.opacitySlider.addEventListener('input', handleOpacityChange);
  elements.textColorPicker.addEventListener('input', handleTextColorChange);
  elements.textColorHex.addEventListener('input', handleTextColorHexChange);
  elements.shadowToggle.addEventListener('change', handleShadowToggle);
  elements.shadowSlider.addEventListener('input', handleShadowStrengthChange);
  elements.positionSelect.addEventListener('change', handlePositionChange);
  elements.verticalOffsetSlider.addEventListener('input', handleVerticalOffsetChange);

  // Advanced settings
  elements.autoLoadToggle.addEventListener('change', handleAutoLoadToggle);
  elements.rememberDelayToggle.addEventListener('change', handleRememberDelayToggle);
  elements.showWhileSeekingToggle.addEventListener('change', handleShowWhileSeekingToggle);
  elements.testSubtitleBtn.addEventListener('click', testSubtitle);
  elements.exportBtn.addEventListener('click', exportSettings);
  elements.importBtn.addEventListener('click', importSettings);
  elements.resetAllBtn.addEventListener('click', resetAllSettings);

  // Collapsible sections
  document.querySelectorAll('.section-header.collapsible').forEach(header => {
    header.addEventListener('click', toggleSection);
  });
}

// ===================================
// Event Handlers
// ===================================

function handleMasterToggle(e) {
  currentSettings.enabled = e.target.checked;
  saveSettings();
  updateExtensionStatus(currentSettings.enabled);
  sendMessageToContent({ type: 'TOGGLE_SUBTITLES', enabled: currentSettings.enabled });

  showToast(
    currentSettings.enabled ? 'Subtitles enabled' : 'Subtitles disabled',
    currentSettings.enabled ? 'success' : 'warning'
  );
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.srt')) {
    showToast('Please select an .srt file', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    showToast('File too large (max 5MB)', 'error');
    return;
  }

  try {
    const content = await readFileContent(file);
    const parsedSubtitle = await parseSRT(content);

    if (!parsedSubtitle || parsedSubtitle.length === 0) {
      showToast('Invalid SRT file format', 'error');
      return;
    }

    // Store subtitle data
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      entryCount: parsedSubtitle.length,
      loadedAt: Date.now()
    };

    await chrome.storage.local.set({
      subtitle: parsedSubtitle,
      subtitleMetadata: metadata
    });

    currentSubtitle = parsedSubtitle;
    updateSubtitleStatus(true, metadata);

    // Notify content script
    sendMessageToContent({ type: 'SUBTITLE_LOADED', subtitle: parsedSubtitle });

    showToast(`Loaded ${parsedSubtitle.length} subtitles`, 'success');

  } catch (error) {
    console.error('Error loading subtitle:', error);
    showToast('Failed to load subtitle file', 'error');
  }

  // Reset file input
  e.target.value = '';
}

function handleUnload() {
  chrome.storage.local.remove(['subtitle', 'subtitleMetadata'], () => {
    currentSubtitle = null;
    updateSubtitleStatus(false, {});
    sendMessageToContent({ type: 'SUBTITLE_UNLOADED' });
    showToast('Subtitle unloaded', 'success');
  });
}

function adjustOffset(delta) {
  currentSettings.subtitleOffset += delta;
  currentSettings.subtitleOffset = Math.round(currentSettings.subtitleOffset * 10) / 10; // Round to 1 decimal

  updateOffsetDisplay();
  saveSettings();
  saveVideoDelay(currentVideoId, currentSettings.subtitleOffset);
  sendMessageToContent({ type: 'OFFSET_CHANGED', offset: currentSettings.subtitleOffset });

  // Pulse animation
  elements.offsetValue.classList.add('pulse');
  setTimeout(() => elements.offsetValue.classList.remove('pulse'), 300);
}

function resetTiming() {
  currentSettings.subtitleOffset = 0;
  updateOffsetDisplay();
  saveSettings();
  saveVideoDelay(currentVideoId, 0);
  sendMessageToContent({ type: 'OFFSET_CHANGED', offset: 0 });
  showToast('Timing reset to 0', 'success');
}

function handleFontSizeChange(e) {
  currentSettings.fontSize = parseInt(e.target.value);
  elements.fontSizeValue.textContent = `${currentSettings.fontSize}px`;
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleBackgroundChange(e) {
  currentSettings.backgroundColor = e.target.value;
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleOpacityChange(e) {
  currentSettings.backgroundOpacity = parseInt(e.target.value);
  elements.opacityValue.textContent = `${currentSettings.backgroundOpacity}%`;
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleTextColorChange(e) {
  currentSettings.textColor = e.target.value;
  elements.textColorHex.value = e.target.value;
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleTextColorHexChange(e) {
  const hex = e.target.value;
  if (/^#[0-9A-F]{6}$/i.test(hex)) {
    currentSettings.textColor = hex;
    elements.textColorPicker.value = hex;
    saveSettings();
    updatePreview();
    sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
  }
}

function handleShadowToggle(e) {
  currentSettings.shadowEnabled = e.target.checked;
  elements.shadowStrengthGroup.style.display = e.target.checked ? 'block' : 'none';
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleShadowStrengthChange(e) {
  currentSettings.shadowStrength = parseInt(e.target.value);
  elements.shadowValue.textContent = `${currentSettings.shadowStrength}%`;
  saveSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handlePositionChange(e) {
  currentSettings.position = e.target.value;
  saveSettings();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleVerticalOffsetChange(e) {
  currentSettings.verticalOffset = parseInt(e.target.value);
  elements.verticalOffsetValue.textContent = `${currentSettings.verticalOffset}px`;
  saveSettings();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function handleAutoLoadToggle(e) {
  currentSettings.autoLoadLast = e.target.checked;
  saveSettings();
}

function handleRememberDelayToggle(e) {
  currentSettings.rememberDelayPerVideo = e.target.checked;
  saveSettings();
}

function handleShowWhileSeekingToggle(e) {
  currentSettings.showWhileSeeking = e.target.checked;
  saveSettings();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
}

function toggleSection(e) {
  const target = e.currentTarget.dataset.target;
  const content = document.getElementById(target);
  const header = e.currentTarget;

  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    header.classList.remove('collapsed');
  } else {
    content.classList.add('collapsed');
    header.classList.add('collapsed');
  }
}

function testSubtitle() {
  sendMessageToContent({ type: 'TEST_SUBTITLE' });
  showToast('Showing test subtitle...', 'success');
}

function exportSettings() {
  const data = {
    settings: currentSettings,
    version: '2.0',
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subflix-settings-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Settings exported', 'success');
}

function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await readFileContent(file);
      const data = JSON.parse(content);

      if (data.settings) {
        currentSettings = { ...currentSettings, ...data.settings };
        await saveSettings();
        updateUIFromSettings();
        updatePreview();
        sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
        showToast('Settings imported successfully', 'success');
      } else {
        showToast('Invalid settings file', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast('Failed to import settings', 'error');
    }
  };
  input.click();
}

async function resetAllSettings() {
  if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
    return;
  }

  currentSettings = {
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

  await saveSettings();
  updateUIFromSettings();
  updatePreview();
  sendMessageToContent({ type: 'SETTINGS_UPDATED', settings: currentSettings });
  showToast('All settings reset to defaults', 'success');
}

// ===================================
// UI Update Functions
// ===================================

function updateUIFromSettings() {
  elements.masterToggle.checked = currentSettings.enabled;
  elements.fontSizeSlider.value = currentSettings.fontSize;
  elements.fontSizeValue.textContent = `${currentSettings.fontSize}px`;

  document.querySelector(`input[name="background"][value="${currentSettings.backgroundColor}"]`).checked = true;

  elements.opacitySlider.value = currentSettings.backgroundOpacity;
  elements.opacityValue.textContent = `${currentSettings.backgroundOpacity}%`;

  elements.textColorPicker.value = currentSettings.textColor;
  elements.textColorHex.value = currentSettings.textColor;

  elements.shadowToggle.checked = currentSettings.shadowEnabled;
  elements.shadowStrengthGroup.style.display = currentSettings.shadowEnabled ? 'block' : 'none';
  elements.shadowSlider.value = currentSettings.shadowStrength;
  elements.shadowValue.textContent = `${currentSettings.shadowStrength}%`;

  elements.positionSelect.value = currentSettings.position;

  elements.verticalOffsetSlider.value = currentSettings.verticalOffset;
  elements.verticalOffsetValue.textContent = `${currentSettings.verticalOffset}px`;

  elements.autoLoadToggle.checked = currentSettings.autoLoadLast;
  elements.rememberDelayToggle.checked = currentSettings.rememberDelayPerVideo;
  elements.showWhileSeekingToggle.checked = currentSettings.showWhileSeeking;

  updateOffsetDisplay();
  updateExtensionStatus(currentSettings.enabled);
}

function updateOffsetDisplay() {
  const offset = currentSettings.subtitleOffset;
  elements.offsetValue.textContent = `${offset >= 0 ? '+' : ''}${offset.toFixed(1)}s`;

  // Color coding
  elements.offsetValue.classList.remove('negative', 'positive');
  if (offset < 0) {
    elements.offsetValue.classList.add('negative');
  } else if (offset > 0) {
    elements.offsetValue.classList.add('positive');
  }
}

function updateExtensionStatus(enabled) {
  const indicator = elements.extensionStatus.querySelector('.status-indicator');
  const textNode = elements.extensionStatus.lastChild;

  if (enabled) {
    indicator.classList.add('active');
    textNode.textContent = ' Active';
  } else {
    indicator.classList.remove('active');
    textNode.textContent = ' Disabled';
  }
}

function updateVideoStatus(detected, message) {
  const indicator = elements.videoStatus.querySelector('.status-indicator');
  const textSpan = elements.videoStatus.lastChild;

  if (detected) {
    indicator.classList.add('detected');
    indicator.classList.remove('warning', 'error');
  } else {
    indicator.classList.remove('detected');
    indicator.classList.add('warning');
  }

  textSpan.textContent = ` ${message}`;
}

function updateSubtitleStatus(loaded, metadata) {
  const indicator = elements.subtitleStatus.querySelector('.status-indicator');
  const textSpan = elements.subtitleStatus.lastChild;

  if (loaded) {
    indicator.classList.add('detected');
    textSpan.textContent = ` ${metadata.fileName || 'Loaded'}`;

    elements.fileInfo.style.display = 'block';
    elements.fileName.textContent = metadata.fileName || 'Unknown';
    elements.fileDetails.textContent = `${metadata.entryCount || 0} subtitle entries • ${formatFileSize(metadata.fileSize || 0)}`;
    elements.unloadBtn.disabled = false;
  } else {
    indicator.classList.remove('detected');
    textSpan.textContent = ' Not loaded';

    elements.fileInfo.style.display = 'none';
    elements.unloadBtn.disabled = true;
  }
}

function updatePreview() {
  const preview = elements.previewText;

  // Apply font size
  preview.style.fontSize = `${currentSettings.fontSize}px`;

  // Apply text color
  preview.style.color = currentSettings.textColor;

  // Apply background
  let bgColor = 'transparent';
  const opacity = currentSettings.backgroundOpacity / 100;

  switch (currentSettings.backgroundColor) {
    case 'transparent':
      bgColor = `rgba(0, 0, 0, ${opacity * 0.3})`;
      break;
    case 'semi':
      bgColor = `rgba(0, 0, 0, ${opacity * 0.6})`;
      break;
    case 'opaque':
      bgColor = `rgba(0, 0, 0, ${opacity})`;
      break;
  }

  preview.style.backgroundColor = bgColor;
  preview.style.padding = currentSettings.backgroundColor !== 'none' ? '8px 16px' : '0';
  preview.style.borderRadius = currentSettings.backgroundColor !== 'none' ? '4px' : '0';

  // Apply shadow
  if (currentSettings.shadowEnabled) {
    const shadowStrength = currentSettings.shadowStrength / 100;
    const shadowOpacity = shadowStrength * 0.9;
    preview.style.textShadow = `2px 2px 4px rgba(0, 0, 0, ${shadowOpacity})`;
  } else {
    preview.style.textShadow = 'none';
  }
}

// ===================================
// Utility Functions
// ===================================

function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse SRT subtitle file
 */
function parseSRT(content) {
  const subtitles = [];
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // Parse timestamp line
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) continue;

    const startTime = parseTimestamp(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
    const endTime = parseTimestamp(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

    // Get subtitle text (remaining lines)
    const text = lines.slice(2).join('\n');

    subtitles.push({
      start: startTime,
      end: endTime,
      text: text
    });
  }

  return subtitles;
}

function parseTimestamp(hours, minutes, seconds, milliseconds) {
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function sendMessageToContent(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  } catch (error) {
    console.error('Error sending message to content script:', error);
  }
}

function showToast(message, type = 'success') {
  elements.toast.className = 'toast show ' + type;
  elements.toastMessage.textContent = message;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };
  elements.toastIcon.textContent = icons[type] || '✓';

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}
