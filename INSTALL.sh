#!/bin/bash

# SubFlix - Quick Installation Script
# Automates the setup process

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║              SubFlix Installation                     ║"
echo "║       Custom Netflix Subtitle Extension              ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the SubFlix directory"
    echo "   (The directory containing manifest.json)"
    exit 1
fi

echo "Step 1/2: Generating icon files..."
echo ""

# Try different icon generation methods
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    ./create-placeholder-icons.sh
elif command -v python3 &> /dev/null; then
    echo "Using Python..."
    python3 create-icons.py
elif command -v rsvg-convert &> /dev/null; then
    echo "Using librsvg..."
    ./create-placeholder-icons.sh
else
    echo "⚠️  No icon converter found."
    echo ""
    echo "Please install one of the following:"
    echo "  • ImageMagick: brew install imagemagick"
    echo "  • Python + Pillow: pip install Pillow"
    echo "  • librsvg: brew install librsvg"
    echo ""
    echo "Or manually create PNG icons (see assets/icons/README-ICONS.md)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 2/2: Installation instructions..."
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║              Installation Complete!                   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "For Chrome/Edge/Brave:"
echo "  1. Open chrome://extensions/"
echo "  2. Enable 'Developer mode' (top-right toggle)"
echo "  3. Click 'Load unpacked'"
echo "  4. Select this folder: $(pwd)"
echo ""
echo "For Firefox:"
echo "  1. Open about:debugging#/runtime/this-firefox"
echo "  2. Click 'Load Temporary Add-on'"
echo "  3. Select manifest-v2.json from: $(pwd)"
echo ""
echo "First time usage:"
echo "  1. Open Netflix and play any video"
echo "  2. Click the SubFlix icon in your toolbar"
echo "  3. Upload a .srt subtitle file"
echo "  4. Enjoy custom subtitles!"
echo ""
echo "Test file: sample-subtitles.srt (included)"
echo "Quick guide: QUICKSTART.md"
echo "Full docs: README.md"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Made with ❤️  for subtitle enthusiasts"
echo "═══════════════════════════════════════════════════════"
