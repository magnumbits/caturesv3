import { ShareError } from './browserUtils';

export async function downloadFile(blob: Blob, filename: string): Promise<void> {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new ShareError(
      'Failed to download file',
      'DOWNLOAD_FAILED'
    );
  }
}

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const blob = await downloadImageFromUrl(imageUrl);
    if (!blob) {
      throw new Error('Failed to download image');
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error('Failed to download image. Please try again.');
  }
}

export async function openInNewTab(url: string): Promise<void> {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    throw new ShareError(
      'Failed to open in new tab',
      'OPEN_TAB_FAILED'
    );
  }
}