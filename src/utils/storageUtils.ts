import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { downloadImageFromUrl } from './imageDownloadUtils';

interface StorageResult {
  success: boolean;
  error: string | null;
  files: Array<{
    name: string;
    id: string;
    url?: string;
    metadata: {
      size: number;
      mimetype: string;
    };
  }> | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function listStylesBucket() {
  try {
    console.log('Starting to list files from styles bucket...');
    
    const { data: files, error: listError } = await retry(() =>
      supabase.storage.from('styles').list()
    );

    console.log('Raw files from styles bucket:', files);

    if (listError) {
      console.error('Error listing files:', listError);
      return {
        success: false,
        error: 'Failed to load styles. Please check your connection and try again.',
        files: null,
      };
    }

    console.log('Generating public URLs for files...');

    const filesWithUrls = await Promise.all((files || []).map(async (file) => {
      const { data: urlData } = await retry(() =>
        supabase.storage.from('styles').getPublicUrl(file.name)
      );

      console.log(`Generated URL for ${file.name}:`, urlData);

      return {
        ...file,
        url: urlData.publicUrl
      };
    }));

    console.log('Final files with URLs:', filesWithUrls);

    return {
      success: true,
      error: null,
      files: filesWithUrls
    } as StorageResult;
  } catch (err) {
    console.error('Unexpected error in listStylesBucket:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      files: null
    } as StorageResult;
  }
}

export async function uploadFaceImage(imageDataUrl: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Convert base64 data URL to blob
    const base64Data = imageDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: 'image/jpeg' });

    // Generate unique filename
    const filename = `${user.id}/${uuidv4()}.jpg`;

    console.log('Uploading face image to path:', filename);

    // Upload to faces bucket
    const { data, error } = await supabase.storage
      .from('faces')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('faces')
      .getPublicUrl(filename);

    console.log('Face image public URL:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      error: null
    };
  } catch (err) {
    console.error('Error uploading face image:', err);
    return {
      success: false,
      url: null,
      error: err instanceof Error ? err.message : 'Failed to upload image'
    };
  }
}