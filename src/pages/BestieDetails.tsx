import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LocationState {
  croppedImageUrl: string;
}

export default function BestieDetails() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { croppedImageUrl } = location.state as LocationState;

  useEffect(() => {
    if (!croppedImageUrl) {
      navigate('/upload');
    }
  }, [croppedImageUrl, navigate]);

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-purple mb-6"
      >
        <ArrowLeft size={24} />
        Back
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary-purple mb-2">
          Spill the Tea! ☕✨
        </h1>
        <p className="text-primary-purple mb-8">
          Tell us about your bestie
        </p>

        <div className="bg-white rounded-3xl p-4 shadow-lg mb-6 aspect-square">
          <img
            src={croppedImageUrl}
            alt="Selected"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-primary-purple font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your bestie's name"
              className="w-full rounded-full px-6 py-4 border-2 border-primary-purple bg-transparent text-primary-purple placeholder-primary-purple/50"
            />
          </div>

          <button
            onClick={() => navigate('/style-selection', { 
              state: { 
                croppedImageUrl,
                bestieName: name 
              }
            })}
            disabled={!name.trim()}
            className="w-full bg-[#D2691E] text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}