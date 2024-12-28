import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coffee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BuyMeCoffeeButton from '../components/BuyMeCoffeeButton';
import { openInNewTab } from '../utils/downloadUtils';

export default function Upgrade() {
  const [hasBought, setHasBought] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const handleBuyMeCoffeeClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await openInNewTab('https://www.buymeacoffee.com/magnumben');
    setHasBought(true);
  };

  const handleGetCredits = async () => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('user_credits')
        .update({ credits: 5 })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      navigate(-1);
    } catch (error) {
      console.error('Failed to add credits:', error);
      alert('Failed to add credits. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-purple mb-6"
      >
        <ArrowLeft size={24} />
        Back
      </button>

      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-primary-purple mb-4">
          Need More Credits? ✨
        </h1>
        
        <p className="text-primary-purple mb-8">
          Support the development of Catures by buying me a hot chocolate!
          Each contribution gets you 5 more credits.
        </p>

        <div className="mb-8">
          <a 
            href="https://www.buymeacoffee.com/magnumben" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleBuyMeCoffeeClick}
            className="inline-block hover:opacity-90 transition-opacity"
          >
            <img 
              src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" 
              alt="Buy Me A Coffee" 
              className="h-[60px] w-[217px]"
            />
          </a>
        </div>

        {hasBought && (
          <div className="space-y-4">
            <label className="flex items-center justify-center gap-2 text-primary-purple cursor-pointer">
              <input
                type="checkbox"
                checked={hasBought}
                onChange={(e) => setHasBought(e.target.checked)}
                className="w-4 h-4 rounded text-primary-purple"
              />
              I've bought you hot chocolate
            </label>

          <button
            onClick={handleGetCredits}
            disabled={!hasBought || isUpdating}
            className="w-full bg-primary-purple text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Coffee size={20} />
            {isUpdating ? 'Adding credits...' : 'Get 5 Credits'}
          </button>
          </div>
        )}
      </div>
    </div>
  );
}