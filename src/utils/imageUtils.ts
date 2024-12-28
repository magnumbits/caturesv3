export async function validateImageResponse(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type');
  return contentType !== null && contentType.startsWith('image/');
}

export async function fetchWithTimeout(url: string, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Use allorigins.win as CORS proxy for external URLs
  const proxyUrl = url.startsWith('http') 
    ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    : url;

  try {
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
      credentials: 'omit',
      headers: {
        'Accept': 'image/jpeg,image/png,image/*',
        'User-Agent': 'Mozilla/5.0',
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }).catch(error => {
    console.error('Error converting blob to base64:', error);
    throw new Error('Failed to convert image format');
  });
}

export async function cropFaceFromImage(
  imageUrl: string,
  box: { x: number, y: number, width: number, height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Add padding around the face (50%)
        const padding = {
          x: box.width * 0.5,
          y: box.height * 0.5
        };

        // Calculate crop dimensions with padding
        const crop = {
          x: Math.max(0, box.x - padding.x),
          y: Math.max(0, box.y - padding.y),
          width: Math.min(img.width - box.x, box.width + (padding.x * 2)),
          height: Math.min(img.height - box.y, box.height + (padding.y * 2))
        };

        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;

        // Draw cropped image
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        ctx.drawImage(
          img,
          crop.x, crop.y, crop.width, crop.height,
          0, 0, crop.width, crop.height
        );

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = imageUrl;
  });
}