import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import { retry } from '../utils/retryUtils';

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        setIsLoading(true);
        const { data: { user } } = await retry(() => supabase.auth.getUser());
        if (!user) {
          setCredits(null);
          return;
        }

        // Try to get existing credits
        let { data, error } = await retry(() => supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single());

        // If no record exists, create one
        if (error?.code === 'PGRST116') {
          const { data: newData, error: insertError } = await retry(() => supabase
            .from('user_credits')
            .insert({ user_id: user.id })
            .select('credits')
            .single());

          if (insertError) throw insertError;
          data = newData;
        } else if (error) {
          throw error;
        }

        setCredits(data.credits);
      } catch (err) {
        console.error('Error fetching credits:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch credits');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredits();
  }, []);

  const deductCredit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_credits')
        .update({ credits: (credits || 0) - 1 })
        .eq('user_id', user.id)
        .select('credits')
        .single();

      if (error) throw error;
      setCredits(data.credits);
      return true;
    } catch (err) {
      console.error('Error deducting credit:', err);
      return false;
    }
  };

  return { credits, isLoading, error, deductCredit };
}