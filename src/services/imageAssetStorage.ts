/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility service to process, normalize, and optimize uploaded character reference assets
 * so they persist reliably within browser storage without hitting QuotaExceededError.
 */

export interface ProcessedReferenceAsset {
  image: string;
  dataUrl: string;
  thumbnail: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

/**
 * Loads an image from a data URL or blob URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image into canvas: ' + e));
    img.src = src;
  });
}

/**
 * Scales an image data URL to a maximum dimension while maintaining aspect ratio,
 * compressing to a high-quality data URL (~60-120KB) to ensure reliable persistence.
 */
export async function optimizeImageDataUrl(
  dataUrl: string,
  maxDimension = 1024,
  quality = 0.88,
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;

  // Preserve SVG vector data URLs as-is
  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.includes('<svg')) {
    return dataUrl;
  }

  // If running in an environment without document/canvas, return as is
  if (typeof document === 'undefined') {
    return dataUrl;
  }

  try {
    const img = await loadImage(dataUrl);
    let { width, height } = img;

    if (width <= maxDimension && height <= maxDimension && dataUrl.length < 250000) {
      // Already small enough, keep as is
      return dataUrl;
    }

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Prefer image/webp or image/jpeg for substantial size savings
    const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const optimized = canvas.toDataURL(mime, quality);

    // Return the smaller of the two if both are valid
    return optimized.length < dataUrl.length ? optimized : dataUrl;
  } catch (err) {
    console.warn('Canvas image optimization failed, using original data URL:', err);
    return dataUrl;
  }
}

/**
 * Generates a lightweight thumbnail for fast grid rendering.
 */
export async function generateThumbnail(
  dataUrl: string,
  maxDimension = 200,
  quality = 0.80,
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;

  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.includes('<svg')) {
    return dataUrl;
  }

  if (typeof document === 'undefined') {
    return dataUrl;
  }

  try {
    const img = await loadImage(dataUrl);
    let { width, height } = img;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}

/**
 * Processes a File selected by the user into optimized image & thumbnail data URLs.
 */
export async function processReferenceFile(file: File): Promise<ProcessedReferenceAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file: ' + file.name));
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;

      try {
        const [optimizedImage, thumbnail] = await Promise.all([
          optimizeImageDataUrl(rawDataUrl, 1024, 0.88),
          generateThumbnail(rawDataUrl, 200, 0.80),
        ]);

        let width = 1024;
        let height = 1024;

        if (typeof document !== 'undefined') {
          try {
            const img = await loadImage(rawDataUrl);
            width = img.width;
            height = img.height;
          } catch {
            // fallback dimensions
          }
        }

        resolve({
          image: optimizedImage,
          dataUrl: optimizedImage,
          thumbnail,
          thumbnailUrl: thumbnail,
          width,
          height,
          fileSize: Math.round(optimizedImage.length * 0.75),
          mimeType: file.type || 'image/jpeg',
        });
      } catch (err) {
        // Fallback to raw data url if optimization failed
        resolve({
          image: rawDataUrl,
          dataUrl: rawDataUrl,
          thumbnail: rawDataUrl,
          thumbnailUrl: rawDataUrl,
          width: 1024,
          height: 1024,
          fileSize: file.size,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };

    reader.readAsDataURL(file);
  });
}
