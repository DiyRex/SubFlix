#!/usr/bin/env python3
"""
SubFlix - Create Simple Placeholder Icons
Creates basic PNG icons if PIL/Pillow is available
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    def create_icon(size, filename):
        """Create a simple icon with SubFlix branding"""
        # Create image with Netflix red background
        img = Image.new('RGB', (size, size), color='#E50914')
        draw = ImageDraw.Draw(img)

        # Draw white subtitle lines
        line_height = max(2, size // 12)
        spacing = max(2, size // 16)

        y1 = int(size * 0.65)
        y2 = y1 + line_height + spacing

        margin = int(size * 0.15)

        # Main subtitle line
        draw.rectangle(
            [margin, y1, size - margin, y1 + line_height],
            fill='white'
        )

        # Secondary subtitle line (slightly smaller)
        draw.rectangle(
            [margin + size//10, y2, size - margin - size//10, y2 + line_height - 2],
            fill='white'
        )

        # Draw simple "S" or subtitle icon in upper portion
        if size >= 48:
            # Draw a simple text/subtitle symbol
            center_x = size // 2
            top_y = int(size * 0.25)

            # Horizontal bars representing text
            bar_width = int(size * 0.5)
            bar_height = max(2, size // 16)
            bar_spacing = max(3, size // 12)

            for i in range(3):
                y = top_y + (bar_height + bar_spacing) * i
                x1 = center_x - bar_width // 2
                x2 = center_x + bar_width // 2
                draw.rectangle([x1, y, x2, y + bar_height], fill='white')

        # Save with transparency (convert to RGBA first)
        img_rgba = Image.new('RGBA', img.size)
        img_rgba.paste(img)

        # Save
        img_rgba.save(filename, 'PNG')
        print(f"✓ Created {filename} ({size}x{size})")

    # Create icons directory if it doesn't exist
    icons_dir = os.path.join(os.path.dirname(__file__), 'assets', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Create icons
    print("Creating SubFlix placeholder icons...")
    create_icon(16, os.path.join(icons_dir, 'icon16.png'))
    create_icon(48, os.path.join(icons_dir, 'icon48.png'))
    create_icon(128, os.path.join(icons_dir, 'icon128.png'))

    print("\n✓ All icons created successfully!")
    print("Icons are located in: assets/icons/")

except ImportError:
    print("⚠ PIL/Pillow not found.")
    print("\nPlease install it with:")
    print("  pip install Pillow")
    print("\nOr use the shell script instead:")
    print("  ./create-placeholder-icons.sh")
    print("\nOr create icons manually (see assets/icons/README-ICONS.md)")
