"""Analyze only image bytes; stdin -> JSON, no files or catalog access."""
import base64
import io
import json
import sys
import time
import warnings

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 50 * 1024 * 1024
MAX_PIXELS = 20_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
warnings.simplefilter("error", Image.DecompressionBombWarning)
REGIONS = {"top_full": (0, 0, 1, 0.25), "top_left": (0, 0, 0.4, 0.25), "top_right": (0.6, 0, 1, 0.25)}


def analyze(data, region="top_full"):
    started = time.perf_counter()
    if not data or len(data) > MAX_BYTES:
        raise ValueError("invalid_size")
    if region not in REGIONS:
        raise ValueError("invalid_region")
    with Image.open(io.BytesIO(data)) as source:
        if source.format not in {"JPEG", "PNG", "WEBP", "TIFF", "BMP"}:
            raise ValueError("unsupported_format")
        if source.width * source.height > MAX_PIXELS:
            raise ValueError("too_many_pixels")
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("multiple_frames")
        # Only orientation is used from EXIF; no catalog/text metadata.
        image = ImageOps.exif_transpose(source).convert("RGB")
    width, height = image.size
    if min(width, height) < 100:
        raise ValueError("image_too_small")
    sample = image.copy()
    sample.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    gray = np.asarray(sample.convert("L"))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    contrast = float(gray.std())
    dark_fraction = float((gray <= 15).mean())
    white_fraction = float((gray >= 245).mean())
    alerts = []
    if sharpness < 60:
        alerts.append("low_sharpness")
    if brightness < 65 or dark_fraction > 0.4:
        alerts.append("dark_image")
    if contrast < 25:
        alerts.append("low_contrast")
    if white_fraction > 0.85:
        alerts.append("large_white_area")
    if min(width, height) < 1000:
        alerts.append("low_resolution")
    ratios = REGIONS[region]
    box = tuple(int(value * (width if index % 2 == 0 else height)) for index, value in enumerate(ratios))
    crop = ImageOps.autocontrast(image.crop(box).convert("L"))
    crop.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    crop.save(output, format="JPEG", quality=92)
    return {
        "quality": {
            "status": "review_recommended" if alerts else "no_obvious_issue",
            "width": width, "height": height,
            "sample_width": sample.width, "sample_height": sample.height,
            "sharpness": round(sharpness, 2), "brightness": round(brightness, 2),
            "contrast": round(contrast, 2), "dark_fraction": round(dark_fraction, 4),
            "white_fraction": round(white_fraction, 4), "alerts": alerts,
        },
        "crop": {
            "region": region, "box": list(box), "width": crop.width, "height": crop.height,
            "jpeg_base64": base64.b64encode(output.getvalue()).decode("ascii"),
        },
        "quality_ms": round((time.perf_counter() - started) * 1000, 2),
    }


if __name__ == "__main__":
    try:
        print(json.dumps(analyze(sys.stdin.buffer.read(MAX_BYTES + 1), sys.argv[1] if len(sys.argv) > 1 else "top_full")))
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        print(json.dumps({"error": "too_many_pixels"}))
        sys.exit(2)
    except (UnidentifiedImageError, OSError):
        print(json.dumps({"error": "invalid_image"}))
        sys.exit(2)
    except ValueError as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(2)
