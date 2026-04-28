#!/usr/bin/env python3
"""Generate Android app icons and splash screen for ExpensesControl."""

from PIL import Image, ImageDraw, ImageFont
import os

INDIGO = (79, 70, 229)  # #4f46e5
WHITE = (255, 255, 255)
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Android icon sizes (dp)
ICON_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
    "playstore": 512,
}

def create_icon(size, text="EC", bg_color=INDIGO, text_color=WHITE):
    """Create a rounded-square icon with centered text."""
    img = Image.new("RGBA", (size, size), (*bg_color, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    radius = size // 6
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=(*bg_color, 255),
    )
    
    # Choose font size relative to icon
    font_size = max(size // 3, 16)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()
    
    # Center text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2
    draw.text((x, y), text, fill=text_color, font=font)
    
    return img

def save_icons(output_dir):
    """Generate all icon sizes and save them."""
    base = os.path.join(output_dir, "..", "..", "..", "..")
    
    # mipmap icons
    for density, size in ICON_SIZES.items():
        if density == "playstore":
            continue
        icon = create_icon(size)
        mipmap_dir = os.path.join(base, f"mipmap-{density}")
        os.makedirs(mipmap_dir, exist_ok=True)
        icon.save(os.path.join(mipmap_dir, "ic_launcher.png"))
        
        # Also create round variant
        icon_round = create_round_icon(size)
        icon_round.save(os.path.join(mipmap_dir, "ic_launcher_round.png"))
        print(f"  {density}: {size}x{size}")
    
    # Play Store icon (512x512) - save to project root
    icon_play = create_icon(512)
    os.makedirs(output_dir, exist_ok=True)
    icon_play.save(os.path.join(output_dir, "playstore-icon.png"))
    print(f"  playstore: 512x512")

def create_round_icon(size):
    """Create a round icon variant."""
    # Start with the square icon
    img = create_icon(size)
    
    # Create a circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([(0, 0), (size - 1, size - 1)], fill=255)
    
    # Apply mask
    rounded = img.copy()
    rounded.putalpha(mask)
    return rounded

def create_splash(output_dir):
    """Create splash screen for all densities."""
    base = os.path.join(output_dir, "..", "..", "..", "..")
    
    SPLASH_SIZES = {
        ("drawable-port-mdpi", 320, 470),
        ("drawable-port-hdpi", 480, 705),
        ("drawable-port-xhdpi", 640, 940),
        ("drawable-port-xxhdpi", 960, 1410),
        ("drawable-port-xxxhdpi", 1280, 1880),
        ("drawable-land-mdpi", 470, 320),
        ("drawable-land-hdpi", 705, 480),
        ("drawable-land-xhdpi", 940, 640),
        ("drawable-land-xxhdpi", 1410, 960),
        ("drawable-land-xxxhdpi", 1880, 1280),
    }
    
    for dirname, width, height in SPLASH_SIZES:
        splash = Image.new("RGBA", (width, height), (*INDIGO, 255))
        draw = ImageDraw.Draw(splash)
        
        # Draw centered EC text
        font_size = max(min(width, height) // 5, 24)
        try:
            font = ImageFont.truetype(FONT_PATH, font_size)
        except Exception:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), "EC", font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (width - text_w) // 2
        y = (height - text_h) // 2
        draw.text((x, y), "EC", fill=WHITE, font=font)
        
        splash_dir = os.path.join(base, dirname)
        os.makedirs(splash_dir, exist_ok=True)
        splash.save(os.path.join(splash_dir, "splash.png"))
        print(f"  splash {dirname}: {width}x{height}")

if __name__ == "__main__":
    res_dir = "/home/kiwi/.openclaw/workspace-dev/expenses-control/client/android/app/src/main/res"
    
    print("Generating icons...")
    save_icons(res_dir)
    
    print("\nGenerating splash screens...")
    create_splash(res_dir)
    
    print("\nDone!")
