import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, RefreshCcw, Share2 } from 'lucide-react';
import DebugConsole from '../components/DebugConsole';
import { shareImage } from '../utils/shareUtils';

interface LocationState {
  generatedImageUrl: string;
  bestieName: string;
  generationId: string; 
}

interface ShareData {
  senderName: string;
  message: string;
}

export default function Generation() {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData>({
    senderName: '',
    message: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  // Safely access state properties
  const generatedImageUrl = state?.generatedImageUrl;
  const bestieName = state?.bestieName;
  const generationId = state?.generationId;

  useEffect(() => {
    setIsFormValid(shareData.message.trim().length > 0 && shareData.senderName.trim().length > 0);
  }, [shareData.message, shareData.senderName]);

  useEffect(() => {
    // Redirect if required state is missing
    if (!state || !generatedImageUrl || !generationId) {
      setError('Invalid access. Please generate a caricature first.');
      navigate('/upload');
      return;
    }
    console.log('Generated image URL:', generatedImageUrl);
  }, [generatedImageUrl, generationId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-primary-yellow p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-purple mb-4">{error}</p>
          <button
            onClick={() => navigate('/upload')}
            className="text-primary-purple hover:opacity-80"
          >
            ← Start Over
          </button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (!shareData.message.trim() || !shareData.senderName.trim()) {
      setFormError('Please add a message and your name');
      return;
    }
    setFormError(null);
    try {
      setIsSharing(true);
      console.log('Starting share process for:', bestieName);
      
      await shareImage({
        title: `${bestieName}'s Holiday Caricature`,
        text: `Check out this fun caricature I made for you! 🎄✨`,
        generationId,
        senderName: shareData.senderName,
        message: shareData.message
      });
      console.log('Share process completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      console.error('Share error:', errorMessage);
      // Show user-friendly error message here if needed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-primary-purple mb-6"
      >
        <Home size={24} />
        Home
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary-purple mb-2">
          {bestieName} got catured! 🎨
        </h1>

        <div className="bg-white rounded-3xl p-4 shadow-lg mb-6 aspect-square">
          <img
            src={generatedImageUrl}
            alt="Generated Caricature"
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              console.error('Failed to load generated image from:', generatedImageUrl);
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dy=".3em" fill="%23999">Failed to load image</text></svg>';
            }}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-primary-purple text-sm mb-2">Message for {bestieName}</label>
            <textarea
              value={shareData.message}
              onChange={(e) => setShareData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Write a short message..."
              className="w-full rounded-lg px-4 py-2 border-2 border-primary-purple bg-transparent text-primary-purple placeholder-primary-purple/50 resize-none"
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-primary-purple mt-1">
              {200 - shareData.message.length} characters remaining
            </p>
          </div>
          <div>
            <label className="block text-primary-purple text-sm mb-2">Your Name</label>
            <input
              type="text"
              value={shareData.senderName}
              onChange={(e) => setShareData(prev => ({ ...prev, senderName: e.target.value }))}
              placeholder="Enter your name"
              className="w-full rounded-lg px-4 py-2 border-2 border-primary-purple bg-transparent text-primary-purple placeholder-primary-purple/50"
              maxLength={50}
            />
          </div>
          {formError && (
            <p className="text-red-500 text-sm text-center">{formError}</p>
          )}
        </div>
        <div className="space-y-4">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full gradient-button-pink-purple text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 size={20} />
              {isSharing ? 'Opening Share...' : 'Send to Bestie 🎄'}
            </div>
          </button>

          <a
            href="#"
            onClick={() => navigate(-1)}
            className="block text-center text-primary-purple hover:opacity-80 transition-opacity text-sm mt-4"
          >
            ← Try another style
          </a>
        </div>
      </div>
      <DebugConsole />
    </div>
  );
}