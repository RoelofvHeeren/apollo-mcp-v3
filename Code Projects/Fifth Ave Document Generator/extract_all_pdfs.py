#!/usr/bin/env python3
"""Extract all PDF pages as images for analysis."""

import fitz  # PyMuPDF
import os

# Define PDF files to extract
pdfs = [
    ("Business Plan – Kaba Kaba Villa Development.pdf", "business_plan_pages"),
    ("Feasibility Study_ Kaba-Kaba Villa Development Pricing Justification.pdf", "feasibility_study_pages"),
    ("New Land - PDF Pack.pdf", "new_land_pack_pages"),
]

base_dir = "/Users/roelofvanheeren/Fifth Ave Document Generator"

for pdf_name, output_folder in pdfs:
    pdf_path = os.path.join(base_dir, pdf_name)
    output_dir = os.path.join(base_dir, output_folder)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Open PDF
        doc = fitz.open(pdf_path)
        print(f"\n{'='*60}")
        print(f"Processing: {pdf_name}")
        print(f"PDF has {len(doc)} pages")
        
        # Extract each page as an image
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Use high DPI for quality (2x zoom = ~144 DPI)
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            
            output_path = os.path.join(output_dir, f"page_{page_num + 1:02d}.png")
            pix.save(output_path)
            print(f"Saved page {page_num + 1} to {output_path}")
        
        doc.close()
        print(f"Completed: {pdf_name}")
        
    except Exception as e:
        print(f"Error processing {pdf_name}: {e}")

print("\n" + "="*60)
print("All PDFs extracted!")
