import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { checkWebShareSupport } from './browserUtils';

interface ShareOptions {
  title: string;
  text: string;
  generationId: string;
  senderName: string;
  message: string;
}

async function generateShareToken(): Promise<string> {
  // Generate a URL-safe token (12 characters to meet minimum length requirement)
  const token = uuidv4().replace(/-/g, '').slice(0, 12);
  return token;
}

async function createShareLink(generationId: string, senderName: string, message: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const shareToken = await generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Link expires in 30 days
    
    console.log('Generated share token:', shareToken);

    const { error } = await supabase
      .from('share_links')
      .insert({
        user_id: user.id,
        generation_id: generationId,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        accessed_count: 0,
        sender_name: senderName,
        message: message
      });

    if (error) {
      throw error;
    }

    // Create shorter, cleaner URL
    return `${window.location.origin}/share/${shareToken}`;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw new Error('Failed to create share link');
  }
}

export async function shareImage({ title, text, generationId, senderName, message }: ShareOptions): Promise<void> {
  try {
    const shareUrl = await createShareLink(generationId, senderName, message);
    console.log('Share URL generated:', shareUrl);

    if (checkWebShareSupport()) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        });
        return;
      } catch (error) {
        console.log('Web Share API failed, falling back to clipboard');
      }
    }
    
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      console.log('Share URL copied to clipboard:', shareUrl);
      alert('Share link copied to clipboard!');
    } catch (clipboardError) {
      console.error('Clipboard fallback failed:', clipboardError);
      console.log('Share URL for manual sharing:', shareUrl);
      alert(`Share this link:\n${shareUrl}`);
    }
  } catch (error) {
    console.error('Share failed:', error);
    if (error instanceof Error) {
      alert(`Sharing failed: ${error.message}`);
    } else {
      alert('Failed to share. Please try again.');
    }
  }
}