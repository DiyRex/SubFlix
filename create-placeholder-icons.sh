#!/bin/bash

# SubFlix - Create Placeholder Icons Script
# This script creates simple placeholder icons for development

echo "Creating placeholder icons for SubFlix..."

cd "$(dirname "$0")/assets/icons"

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "ImageMagick found. Converting SVG to PNG..."

    convert -background none icon.svg -resize 16x16 icon16.png
    convert -background none icon.svg -resize 48x48 icon48.png
    convert -background none icon.svg -resize 128x128 icon128.png

    echo "✓ Icons created successfully!"
    echo "  - icon16.png (16x16)"
    echo "  - icon48.png (48x48)"
    echo "  - icon128.png (128x128)"

elif command -v rsvg-convert &> /dev/null; then
    echo "rsvg-convert found. Converting SVG to PNG..."

    rsvg-convert -w 16 -h 16 icon.svg -o icon16.png
    rsvg-convert -w 48 -h 48 icon.svg -o icon48.png
    rsvg-convert -w 128 -h 128 icon.svg -o icon128.png

    echo "✓ Icons created successfully!"

elif command -v inkscape &> /dev/null; then
    echo "Inkscape found. Converting SVG to PNG..."

    inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
    inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
    inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128

    echo "✓ Icons created successfully!"

else
    echo "⚠ No SVG converter found."
    echo ""
    echo "Please install one of the following:"
    echo "  - ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    echo "  - librsvg: brew install librsvg (macOS) or apt-get install librsvg2-bin (Linux)"
    echo "  - Inkscape: Download from https://inkscape.org"
    echo ""
    echo "Or manually create PNG icons (16x16, 48x48, 128x128) and place them in assets/icons/"
    echo "See README-ICONS.md for more details."
    exit 1
fi

echo ""
echo "Icons are ready! You can now load the extension in your browser."
