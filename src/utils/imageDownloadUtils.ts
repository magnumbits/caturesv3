import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 15000;

export async function downloadImageFromUrl(imageUrl: string): Promise<Blob> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'blob',
        timeout: TIMEOUT_MS,
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      // Validate content type
      const contentType = response.headers['content-type'];
      if (!contentType?.startsWith('image/')) {
        throw new Error('Invalid content type: ' + contentType);
      }

      return response.data;
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed, ${error instanceof Error ? error.message : 'unknown error'}`);
      lastError = error instanceof Error ? error : new Error('Download failed');

      // On last attempt, try CORS proxy
      if (attempt === MAX_RETRIES - 1) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
          const proxyResponse = await axios.get(proxyUrl, {
            responseType: 'blob',
            timeout: TIMEOUT_MS,
            headers: {
              'Accept': 'image/*',
              'Cache-Control': 'no-cache'
            }
          });

          if (!proxyResponse.data || !(proxyResponse.data instanceof Blob)) {
            throw new Error('Invalid proxy response format');
          }
          
          // Validate proxy response content type
          const proxyContentType = proxyResponse.headers['content-type'];
          if (!proxyContentType?.startsWith('image/')) {
            throw new Error('Invalid proxy content type: ' + proxyContentType);
          }

          return proxyResponse.data;
        } catch (proxyError) {
          console.error('Proxy download failed:', proxyError);
          throw new Error('Failed to download image after all attempts');
        }
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
    }
  }

  throw lastError || new Error('Failed to download image');
}