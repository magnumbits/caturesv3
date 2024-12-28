import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Coins, SparklesIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useCredits } from '../hooks/useCredits';

interface Generation {
  id: string;
  bestie_name: string;
  generated_image_url: string;
  created_at: string;
}

export default function Account() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { credits, isLoading: isLoadingCredits } = useCredits();
  const [pastCatures, setPastCatures] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function fetchGenerations() {
      try {
        const { data, error } = await supabase
          .from('generations')
          .select('id, bestie_name, generated_image_url, created_at')
          .eq('user_id', user.id)
          .eq('status', 'generation_completed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPastCatures(data || []);
      } catch (error) {
        console.error('Error fetching generations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGenerations();
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleCatureClick = (generation: Generation) => {
    navigate('/generation', {
      state: {
        generatedImageUrl: generation.generated_image_url,
        bestieName: generation.bestie_name,
        generationId: generation.id
      }
    });
  };

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-primary-purple mb-6"
      >
        <ArrowLeft size={24} />
        Back
      </button>

      <div className="max-w-md mx-auto space-y-6">
        {/* User Profile */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-primary-purple">
                {user?.phone || 'No phone number'}
              </h2>
            </div>
            <button
              onClick={handleSignOut}
              className="text-primary-purple hover:opacity-80"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Credits Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-purple/10 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary-purple" />
            </div>
            <div>
              <p className="text-sm text-primary-purple/80">Available Credits</p>
              <p className="text-2xl font-bold text-primary-purple">
                {isLoadingCredits ? '...' : credits || 0}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/upgrade')}
            className="w-full bg-primary-purple text-white rounded-full py-3 font-medium hover:opacity-90 transition-opacity"
          >
            Get More Credits
          </button>
        </div>

        {/* Past Catures */}
        <div>
          <h3 className="text-xl font-bold text-primary-purple mb-4">
            Past Catures
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-primary-purple">
              Loading...
            </div>
          ) : pastCatures.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {pastCatures.map((cature) => (
                <button
                  key={cature.id}
                  onClick={() => handleCatureClick(cature)}
                  className="aspect-square bg-white rounded-2xl p-2 hover:scale-95 transition-transform"
                >
                  <img
                    src={cature.generated_image_url}
                    alt={cature.bestie_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-3xl">
              <SparklesIcon className="w-12 h-12 text-primary-purple mx-auto mb-2" />
              <p className="text-primary-purple">No catures yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 text-sm text-primary-purple hover:opacity-80"
              >
                Create your first cature →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}