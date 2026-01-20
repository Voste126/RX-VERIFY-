"""
QR Code generation utilities for lot manifests.

Distributors use this to generate QR codes for printing on medicine packages.
Each QR code contains the lot_id that patients can scan to verify authenticity.
"""
import qrcode
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os


def generate_qr_code(lot_manifest, include_url=True):
    """
    Generate QR code for a lot manifest.
    
    Args:
        lot_manifest: LotManifest instance
        include_url: If True, encode full URL; if False, just lot_id
    
    Returns:
        PIL Image object
    """
    # QR code data
    if include_url:
        # Full URL for direct app deep linking
        qr_data = f"https://rxverify.app/verify/{lot_manifest.id}"
    else:
        # Just the lot ID (app will construct URL)
        qr_data = str(lot_manifest.id)
    
    # Create QR code with explicit image factory
    qr = qrcode.QRCode(
        version=1,  # Size (1-40, 1 is smallest)
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
        box_size=10,  # Pixel size of each box
        border=4,  # Border size
    )
    
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create image using PIL Image factory explicitly
    img = qr.make_image(fill_color="black", back_color="white", image_factory=None)
    
    # Convert to PIL Image if needed
    if not isinstance(img, Image.Image):
        # Convert from qrcode image to PIL Image
        img = img.convert('RGB')
    
    return img


def generate_qr_with_label(lot_manifest, save_path=None):
    """
    Generate QR code with batch number label below it.
    
    Args:
        lot_manifest: LotManifest instance
        save_path: Optional path to save the image
    
    Returns:
        PIL Image object with label
    """
    # Generate QR code
    qr_img = generate_qr_code(lot_manifest)
    
    # Create new image with space for label
    label_height = 60
    new_img = Image.new('RGB', (qr_img.width, qr_img.height + label_height), 'white')
    
    # Paste QR code
    new_img.paste(qr_img, (0, 0))
    
    # Add text label
    draw = ImageDraw.Draw(new_img)
    try:
        # Try to load TrueType font
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = f"Batch: {lot_manifest.batch_number}"
    medicine_text = lot_manifest.medicine.name[:30]  # Truncate if too long
    
    # Calculate text position (centered)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (new_img.width - text_width) // 2
    text_y = qr_img.height + 5
    
    draw.text((text_x, text_y), text, fill='black', font=font)
    
    # Add medicine name
    bbox2 = draw.textbbox((0, 0), medicine_text, font=font)
    text_width2 = bbox2[2] - bbox2[0]
    text_x2 = (new_img.width - text_width2) // 2
    text_y2 = text_y + 20
    
    draw.text((text_x2, text_y2), medicine_text, fill='black', font=font)
    
    # Save if path provided
    if save_path:
        os.makedirs(os.path.dirname(save_path) if os.path.dirname(save_path) else '.', exist_ok=True)
        new_img.save(save_path)
    
    return new_img


def batch_generate_qr_codes(queryset, output_dir='qr_codes'):
    """
    Generate QR codes for multiple lot manifests.
    
    Args:
        queryset: QuerySet of LotManifest objects
        output_dir: Directory to save QR codes
    
    Returns:
        List of (lot_manifest, file_path) tuples
    """
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    for lot_manifest in queryset:
        filename = f"{lot_manifest.batch_number}.png"
        filepath = os.path.join(output_dir, filename)
        
        img = generate_qr_with_label(lot_manifest, save_path=filepath)
        results.append((lot_manifest, filepath))
    
    return results
