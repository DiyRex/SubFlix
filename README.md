# SubFlix - Custom Netflix Subtitles

> Add custom SRT subtitle files to Netflix with advanced timing controls and styling options

A powerful browser extension that allows you to load your own subtitle files (SRT format) into Netflix, with full control over timing, appearance, and positioning. Perfect for watching content in languages not officially supported by Netflix, or for using community-created subtitles.

## ✨ Features

### Core Functionality
- 📄 **Load Custom SRT Files** - Upload any .srt subtitle file
- ⏱️ **Advanced Timing Controls** - Fine-tune subtitle sync with ±0.1s precision
- 🎨 **Customizable Appearance** - Adjust font size, colors, background, and shadows
- 💾 **Smart Persistence** - Remembers your settings and delay per video
- 🌐 **Multi-language Support** - Full Unicode support including Sinhala, Arabic, Chinese, etc.
- ⌨️ **Keyboard Shortcuts** - Quick access to common controls

### Advanced Features
- Per-video delay memory
- Real-time subtitle preview
- Settings export/import
- Multiple position options (top, middle, bottom)
- Customizable background opacity
- Text shadow controls
- Auto-load last subtitle (optional)

## 🚀 Installation

### Chrome / Edge / Brave

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/subflix.git
   cd subflix
   ```

2. **Generate Icons** (choose one method):
   ```bash
   # Using shell script (requires ImageMagick, rsvg-convert, or Inkscape)
   ./create-placeholder-icons.sh

   # OR using Python (requires Pillow)
   python3 create-icons.py
   ```

3. **Load in Browser**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `SubFlix` folder

### Firefox

1. **Download and prepare** (same as above)

2. **Load in Firefox**
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Navigate to the `SubFlix` folder
   - Select `manifest-v2.json`

**Note:** In Firefox, the extension will be removed when you close the browser. For permanent installation, you'll need to sign it through Firefox Add-ons.

## 📖 Usage Guide

### Basic Usage

1. **Open Netflix** and start playing any video

2. **Click the SubFlix extension icon** in your browser toolbar

3. **Upload a subtitle file**:
   - Click "Upload Subtitle" button
   - Select your `.srt` file
   - Wait for confirmation

4. **Adjust timing** (if needed):
   - Use the timing buttons to sync subtitles
   - `-5s` to `-0.1s` for early subtitles
   - `+0.1s` to `+5s` for late subtitles

5. **Customize appearance** (optional):
   - Adjust font size
   - Change background opacity
   - Modify text color
   - Toggle shadows

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Toggle subtitles on/off |
| `Ctrl+→` | Delay +0.5s |
| `Ctrl+←` | Delay -0.5s |
| `Ctrl+↑` | Increase font size |
| `Ctrl+↓` | Decrease font size |
| `Ctrl+0` | Reset delay to 0 |

*Note: Use `Cmd` instead of `Ctrl` on macOS*

## 📝 SRT File Format

SubFlix supports standard SRT (SubRip) format:

```srt
1
00:00:01,000 --> 00:00:04,000
First subtitle line
Can be multiple lines

2
00:00:05,000 --> 00:00:08,000
Second subtitle
```

### SRT Format Requirements
- Sequential numbering (1, 2, 3...)
- Timestamp format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
- Text content (can be multi-line)
- Empty line between subtitles

### Finding Subtitles

**Popular sources:**
- [OpenSubtitles.org](https://www.opensubtitles.org/)
- [Subscene](https://subscene.com/)
- [YIFY Subtitles](https://yifysubtitles.org/)
- Community forums and fan translations

## ⚙️ Configuration

### Settings Explained

| Setting | Description | Default |
|---------|-------------|---------|
| **Extension Toggle** | Enable/disable subtitles | ON |
| **Font Size** | Subtitle text size (12-48px) | 24px |
| **Background** | Subtitle background style | Opaque |
| **Background Opacity** | Background transparency | 85% |
| **Text Color** | Subtitle text color | White (#FFFFFF) |
| **Shadow** | Enable text shadow for better readability | ON |
| **Shadow Strength** | Shadow intensity | 90% |
| **Position** | Where to show subtitles (top/middle/bottom) | Bottom |
| **Vertical Offset** | Distance from edge (0-200px) | 80px |
| **Auto-load Last** | Automatically load last used subtitle | OFF |
| **Remember Delay per Video** | Save timing offset for each video | ON |

### Exporting/Importing Settings

1. **Export**: Click "Export" in Advanced Settings to save current configuration
2. **Import**: Click "Import" and select a previously exported JSON file

## 🔧 Troubleshooting

### Subtitles not appearing?

1. ✅ Check that the extension is enabled (toggle switch in popup)
2. ✅ Verify subtitle file was uploaded successfully
3. ✅ Ensure you're on a Netflix video page (not browse page)
4. ✅ Try refreshing the Netflix page
5. ✅ Check browser console for errors (F12 → Console tab)

### Timing is off?

- Use the timing controls to adjust
- Large adjustments: ±1s or ±5s buttons
- Fine adjustments: ±0.1s buttons
- The offset will be remembered for this video (if enabled)

### Subtitles don't match video language?

- Make sure you downloaded the correct subtitle file
- Check that the subtitle file matches the episode/movie
- Verify the subtitle language in the file

### Extension not loading?

1. Make sure you generated the icon files (see Installation)
2. Check for errors in `chrome://extensions/`
3. Try reloading the extension
4. Check that manifest.json is valid

### File upload fails?

- Maximum file size: 5MB
- Only `.srt` files are supported
- Check that the file is valid SRT format
- Try opening the file in a text editor to verify format

## 🛠️ Development

### Project Structure

```
SubFlix/
├── manifest.json              # Chrome V3 manifest
├── manifest-v2.json          # Firefox V2 manifest
├── popup/
│   ├── popup.html           # Extension UI
│   ├── popup.css            # UI styles
│   └── popup.js             # UI logic
├── content/
│   ├── content.js           # Netflix integration
│   ├── subtitle-engine.js   # SRT parser & sync
│   └── overlay.js           # Subtitle display
├── background/
│   └── background.js        # Service worker
├── lib/
│   ├── storage.js          # Storage helpers
│   └── utils.js            # Utilities
└── assets/
    ├── icons/              # Extension icons
    └── styles/             # Additional CSS
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/yourusername/subflix.git
cd subflix

# Generate icons
./create-placeholder-icons.sh
# or
python3 create-icons.py

# Load in browser (see Installation section)
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

- Netflix's UI updates may occasionally hide the subtitle overlay (refresh page to fix)
- Very long subtitle lines may require manual line breaks in the SRT file
- Fullscreen mode on some systems may require position adjustment

## 📋 FAQ

**Q: Is this legal?**
A: Yes. The extension only displays subtitle files you provide. Ensure you have the right to use any subtitle files you download.

**Q: Does this work with Netflix's existing subtitles?**
A: SubFlix adds custom subtitles on top of the video. You can disable Netflix's built-in subtitles for a cleaner experience.

**Q: Can I use this with other streaming services?**
A: Currently, SubFlix is designed specifically for Netflix. Support for other platforms may be added in the future.

**Q: Will Netflix detect this extension?**
A: The extension only adds visual overlays to your browser. It doesn't modify Netflix's code or violate their terms of service.

**Q: Can I use multiple subtitle files at once?**
A: Not in the current version. This feature is planned for a future release.

**Q: Does this work on mobile?**
A: No, browser extensions are not supported on mobile Netflix apps. Desktop browsers only.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Netflix Sans font rendering
- SRT subtitle format specification
- Community subtitle contributors
- Open source browser extension ecosystem

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DiyRex/subflix/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DiyRex/subflix/discussions)

## 🗺️ Roadmap

### Planned Features
- [ ] Auto-download subtitles from OpenSubtitles API
- [ ] Support for ASS/SSA subtitle formats
- [ ] Multiple simultaneous subtitle tracks
- [ ] Subtitle editor within extension
- [ ] Cloud sync for subtitle library
- [ ] Support for other streaming platforms
- [ ] Subtitle search by movie/show name
- [ ] Better Netflix UI integration

---

**Made with ❤️ for subtitle enthusiasts worldwide**

*SubFlix is not affiliated with Netflix, Inc.*
