import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDropBestie = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/upload');
    }
  };

  return (
    <div className="min-h-screen bg-primary-yellow flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        {user && (
          <button
            onClick={() => navigate('/account')}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <span className="text-primary-purple text-sm">👤</span>
          </button>
        )}
      </div>
      
      <div className="text-center max-w-xs">
        <h1 className="text-4xl font-bold text-primary-purple mb-2">Catures</h1>
        <p className="text-base text-primary-purple mb-6">
          Transform your bestie into a holiday masterpiece ✨
        </p>
        
        <button
          onClick={handleDropBestie}
          className="bg-primary-purple text-white rounded-full py-2.5 px-6 text-sm font-medium flex items-center justify-center gap-2 w-full hover:opacity-90 transition-opacity"
        >
          <Sparkles size={16} />
          Drop Your Bestie
        </button>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}