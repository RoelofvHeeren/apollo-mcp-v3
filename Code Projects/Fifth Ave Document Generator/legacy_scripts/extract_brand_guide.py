#!/usr/bin/env python3
"""Extract Brand Guide PDF pages as images."""

import fitz  # PyMuPDF
import os

# Define paths
pdf_path = "/Users/roelofvanheeren/Code Projects/Fifth Ave Document Generator/Brand Kit - Fifth Avenue/FifthAve_BrandGuide_2024_Folder/FifthAve_BrandGuide_2024.pdf"
output_dir = "/Users/roelofvanheeren/Code Projects/Fifth Ave Document Generator/brand_guide_pages"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Open PDF
doc = fitz.open(pdf_path)
print(f"Brand Guide PDF has {len(doc)} pages")

# Extract each page as an image
for page_num in range(len(doc)):
    page = doc[page_num]
    # Use high DPI for quality
    mat = fitz.Matrix(2, 2)  # 2x zoom
    pix = page.get_pixmap(matrix=mat)
    
    output_path = os.path.join(output_dir, f"brand_guide_page_{page_num + 1:02d}.png")
    pix.save(output_path)
    print(f"Saved page {page_num + 1} to {output_path}")

print(f"\nExtracted {len(doc)} pages from brand guide")
doc.close()
