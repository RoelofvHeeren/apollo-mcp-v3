---
name: vertex-ai-imagen
description: "Generate images using Google Vertex AI Imagen 3. Use when: creating website mockups, generating hero images, creating social media graphics, or producing marketing visuals."
metadata:
  openclaw:
    emoji: "🎨"
---

# Vertex AI Imagen 3 Integration

## Overview
Google's highest quality image generation model. Released Dec 2024.

## Pricing
- Imagen 3: ~$0.04 per image (1024x1024)
- Editing features: Additional cost

## Setup
1. Enable Vertex AI API in Google Cloud Console
2. Set up service account with Vertex AI permissions
3. Install client library: `pip install google-cloud-aiplatform`

## Generate Image

### Python
```python
from google.cloud import aiplatform
from vertexai.preview.vision_models import ImageGenerationModel

# Initialize
aiplatform.init(project="your-project", location="us-central1")

# Load model
model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")

# Generate
images = model.generate_images(
    prompt="Modern real estate website hero image, luxury London apartment, floor-to-ceiling windows, city skyline view at sunset, warm lighting, professional photography style, 4k, high detail",
    number_of_images=1,
    aspect_ratio="16:9",
    safety_filter_level="block_some",
    person_generation="allow_adult",
)

# Save
images[0].save(location="hero-image.png")
```

## Advanced Features

### Image Editing (Inpainting)
```python
# Edit specific region
edited_images = model.edit_image(
    base_image=original_image,
    mask=mask_image,
    prompt="Add modern furniture to the living room",
)
```

### Upscaling
```python
# 2x or 4x upscaling
upscaled = model.upscale_image(
    image=generated_image,
    upscale_factor="x2"
)
```

### Style Transfer
```python
# Apply brand style
styled = model.generate_images(
    prompt="Real estate website hero image",
    style_reference_images=[brand_style_image],
    guidance_scale=20,
)
```

## Prompt Engineering Tips

**Good prompts:**
- Be specific: "Modern minimalist living room, white walls, oak floors"
- Add style: "Professional architectural photography, golden hour lighting"
- Include format: "Website hero banner, 16:9 aspect ratio"

**Website image types:**
```python
prompts = {
    "hero": "Luxury real estate hero image, modern penthouse interior, floor-to-ceiling windows, city skyline, warm sunset lighting, professional photography",
    "testimonial_bg": "Abstract soft gradient background, teal and white, subtle texture, modern minimal",
    "property_card": "Cozy bedroom interior, natural light, modern decor, wide angle, real estate listing photo",
    "cta_section": "Happy couple receiving house keys, modern home entrance, bright daylight, lifestyle photography"
}
```

## Integration with Website Builder
```python
def generate_website_images(property_type, location):
    """Generate complete image set for a website"""
    
    images = {}
    
    # Hero image
    images['hero'] = model.generate_images(
        prompt=f"Stunning {property_type} in {location}, hero banner image, golden hour, professional real estate photography",
        aspect_ratio="16:9"
    )[0]
    
    # Gallery images
    for room in ['living_room', 'kitchen', 'bedroom', 'bathroom']:
        images[room] = model.generate_images(
            prompt=f"Modern {room.replace('_', ' ')}, {property_type} style, natural light, interior design photography",
            aspect_ratio="4:3"
        )[0]
    
    return images
```

## Safety & Watermarking
- All images have SynthID watermark (invisible)
- Safety filters block harmful content
- Customer data not used for training
