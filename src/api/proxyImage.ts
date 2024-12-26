import { blobToBase64, fetchWithTimeout, validateImageResponse } from '../utils/imageUtils';

export async function proxyImage(imageUrl: string): Promise<string> {
  try {
    console.log('Proxying image from:', imageUrl);
    const response = await fetchWithTimeout(imageUrl);

    if (!await validateImageResponse(response)) {
      throw new Error('Invalid image content received');
    }

    const blob = await response.blob();
    console.log('Image proxied successfully');
    return await blobToBase64(blob);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', errorMessage);
    throw new Error(`Failed to proxy image: ${errorMessage}`);
  }
}