import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { supabase } from '../lib/supabase';
import { Home, Download } from 'lucide-react';
import { downloadImage } from '../utils/downloadUtils';

interface ShareData {
  bestieName: string;
  imageUrl: string;
  senderName: string;
  message: string;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchShareData() {
      try {
        // Get share link data
        const { data: shareLink, error: shareLinkError } = await supabase
          .from('share_links')
          .select('generation_id, sender_name, message')
          .eq('share_token', token)
          .single();

        if (shareLinkError) throw shareLinkError;
        if (!shareLink) throw new Error('Share link not found');

        // Get generation data
        const { data: generation, error: generationError } = await supabase
          .from('generations')
          .select('bestie_name, generated_image_url')
          .eq('id', shareLink.generation_id)
          .single();

        if (generationError) throw generationError;
        if (!generation) throw new Error('Generation not found');

        setShareData({
          bestieName: generation.bestie_name,
          imageUrl: generation.generated_image_url,
          senderName: shareLink.sender_name || '',
          message: shareLink.message || ''
        });

        // Update access count
        await supabase
          .from('share_links')
          .update({ accessed_count: shareLink.accessed_count + 1 })
          .eq('share_token', token);

      } catch (err) {
        console.error('Error fetching share data:', err);
        setError('This share link is invalid or has expired');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchShareData();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-yellow flex items-center justify-center p-4">
        <div className="text-primary-purple">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-yellow p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-primary-purple mb-4">Oops!</h1>
          <p className="text-primary-purple mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-purple hover:opacity-80"
          >
            <Home size={20} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen bg-primary-yellow p-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-primary-purple">Share link not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary-purple mb-2">
          From {shareData.senderName || 'a friend'}, with love... ✨
        </h1>

        <div className="bg-white rounded-3xl p-4 shadow-lg mb-6 aspect-square">
          <img
            src={shareData.imageUrl}
            alt="Generated Caricature"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        {shareData.message && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 mb-6 text-center">
            <p className="font-['Dancing_Script'] text-xl text-primary-purple">
              {shareData.message}
            </p>
          </div>
        )}

        <button
          onClick={() => downloadImage(shareData.imageUrl, `${shareData.bestieName}-caricature.jpg`)}
          className="w-full gradient-button-blue-green text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 mb-4"
        >
          <Download size={20} />
          Download Caricature
        </button>

        <Link
          to="/"
          className="w-full gradient-button-pink-purple text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
        >
          Create Your Own Caricature
        </Link>
      </div>
    </div>
  );
}