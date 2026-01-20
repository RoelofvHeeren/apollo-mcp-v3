#!/usr/bin/env python3
"""Extract PDF pages as images and save them for analysis."""

import fitz  # PyMuPDF
import os

# Define paths
pdf_path = "/Users/roelofvanheeren/Fifth Ave Document Generator/Fifth Ave Coprorate Profile.pdf"
output_dir = "/Users/roelofvanheeren/Fifth Ave Document Generator/extracted_pages"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Open PDF
doc = fitz.open(pdf_path)
print(f"PDF has {len(doc)} pages")

# Extract each page as an image
for page_num in range(len(doc)):
    page = doc[page_num]
    # Use high DPI for quality (300 DPI)
    mat = fitz.Matrix(2, 2)  # 2x zoom = ~144 DPI, good balance
    pix = page.get_pixmap(matrix=mat)
    
    output_path = os.path.join(output_dir, f"page_{page_num + 1:02d}.png")
    pix.save(output_path)
    print(f"Saved page {page_num + 1} to {output_path}")

# Also extract embedded images
images_dir = os.path.join(output_dir, "embedded_images")
os.makedirs(images_dir, exist_ok=True)

image_count = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        try:
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_path = os.path.join(images_dir, f"page{page_num + 1}_img{img_index + 1}.{image_ext}")
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            image_count += 1
            print(f"Extracted embedded image: {image_path}")
        except Exception as e:
            print(f"Could not extract image {xref}: {e}")

print(f"\nExtracted {len(doc)} pages and {image_count} embedded images")
doc.close()
