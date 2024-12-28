import { supabase } from '../lib/supabase';
import { retry } from '../utils/retryUtils';

export type GenerationStatus = 
  | 'face_uploaded'
  | 'generation_initiated'
  | 'generation_completed'
  | 'generation_failed'
  | 'generation_timeout';

export interface Generation {
  id: string;
  user_id: string;
  bestie_name: string;
  face_image_url: string;
  generated_image_url?: string;
  style_id?: string;
  status: GenerationStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export async function createGeneration(
  bestieName: string,
  faceImageUrl: string,
  styleId?: string
): Promise<Generation> {
  const { data: { user } } = await retry(() => supabase.auth.getUser());
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await retry(() => supabase
    .from('generations')
    .insert({
      user_id: user.id,
      bestie_name: bestieName,
      face_image_url: faceImageUrl,
      style_id: styleId,
      status: 'face_uploaded'
    })
    .select()
    .single());

  if (error) throw error;
  return data;
}

export async function updateGenerationStatus(
  id: string,
  status: GenerationStatus,
  updates: Partial<{
    generated_image_url: string;
    error_message: string;
  }> = {}
): Promise<void> {
  const { error } = await retry(() => supabase
    .from('generations')
    .update({
      status,
      ...updates
    })
    .eq('id', id));

  if (error) throw error;
}

export async function getOngoingGeneration(): Promise<Generation | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await retry(() => supabase
      .from('generations')
      .select()
      .eq('user_id', user.id)
      .in('status', ['face_uploaded', 'generation_initiated'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single());

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST104') return null;
      throw error;
    }

    return data;
  } catch (error) {
    // Don't log PGRST116/104 errors as they're expected when no generation exists
    if (error instanceof Error && 
        !['PGRST116', 'PGRST104'].includes((error as any).code)) {
      console.error('Error fetching ongoing generation:', error);
    }
    return null;
  }
}

export async function getGenerationById(id: string): Promise<Generation | null> {
  try {
    const { data, error } = await retry(() => supabase
      .from('generations')
      .select()
      .eq('id', id)
      .single());

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching generation by ID:', error);
    return null;
  }
}