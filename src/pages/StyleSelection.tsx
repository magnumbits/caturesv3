import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listStylesBucket, uploadFaceImage, saveGeneratedCaricature } from '../utils/storageUtils';
import DebugConsole from '../components/DebugConsole';
import { generateCaricature, pollGenerationStatus } from '../services/segmind';
import { createGeneration, updateGenerationStatus } from '../services/generations';
import { useCredits } from '../hooks/useCredits';

interface LocationState {
  croppedImageUrl: string;
  bestieName: string;
}

interface StyleFile {
  name: string;
  id: string;
  url?: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function StyleSelection() {
  const [styles, setStyles] = useState<StyleFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const { credits, isLoading: isLoadingCredits, deductCredit } = useCredits();
  
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(locationState?.croppedImageUrl || null);
  const [bestieName, setBestieName] = useState<string | null>(locationState?.bestieName || null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [pollUrl, setPollUrl] = useState<string | null>(null);

  const getStyleName = (filename: string) => {
    const nameWithoutExt = filename.split('.')[0];
    return nameWithoutExt
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    async function fetchStyles() {
      try {
        console.log('Fetching styles...');
        const result = await listStylesBucket();
        console.log('Fetch result:', result);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to access styles bucket');
        }

        const stylesList = result.files || [];
        console.log('Setting styles:', stylesList);
        setStyles(stylesList);
      } catch (err) {
        console.error('Error in fetchStyles:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load styles: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStyles();
  }, []);

  useEffect(() => {
    async function checkOngoingGeneration() {
      try {
        const ongoingGeneration = await getOngoingGeneration();

        if (ongoingGeneration) {
          setCroppedImageUrl(ongoingGeneration.face_image_url);
          setBestieName(ongoingGeneration.bestie_name);
          setGenerationId(ongoingGeneration.id);
          setSelectedStyle(ongoingGeneration.style_id || null);
          setIsGenerating(true);
          handleGenerate(ongoingGeneration.id);
        } else if (!croppedImageUrl || !bestieName) {
          navigate('/upload');
        }
      } catch (error) {
        console.error('Error checking ongoing generation:', error);
        if (!croppedImageUrl || !bestieName) {
          navigate('/upload');
        }
      }
    }
    
    checkOngoingGeneration();
  }, [navigate, croppedImageUrl, bestieName]);

  const handleGenerate = async (existingGenerationId?: string) => {
    if (!selectedStyle) return;
    
    if (!croppedImageUrl || !bestieName) {
      setError('Missing required information. Please try again.');
      return;
    }
    
    if (!credits || credits < 1) {
      navigate('/upgrade');
      return;
    }

    // Use existing generation ID if provided
    let generation;
    if (existingGenerationId) {
      generation = { id: existingGenerationId };
    } else {
      // Upload face image to get public URL
      const uploadResult = await uploadFaceImage(croppedImageUrl);
      if (!uploadResult.success || !uploadResult.url) {
        console.error('Face image upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
      console.log('Face image uploaded successfully:', uploadResult.url);

      // Create generation record
      generation = await createGeneration(
        bestieName,
        uploadResult.url,
        selectedStyle
      );
    }
    const MAX_RETRIES = 600; // 20 minutes worth of polls
    const POLLING_INTERVAL_MS = 2000;
    let attempts = 0;
    try {
      setIsGenerating(true);
      setError(null);
      console.log('Starting generation process...');

      // Get style image URL
      const selectedStyleObj = styles.find(s => s.name === selectedStyle);
      if (!selectedStyleObj?.url) {
        console.error('Selected style not found:', selectedStyle);
        throw new Error('Selected style not found');
      }
      console.log('Style image URL:', selectedStyleObj.url);

      // Generate caricature
      console.log('Initiating caricature generation...');
      let segmindResponse;
      
      if (!generation || generation.status !== 'generation_initiated') {
        segmindResponse = await generateCaricature(generation.face_image_url, selectedStyleObj.url);
        await updateGenerationStatus(generation.id, 'generation_initiated');
        console.log('Generation initiated:', segmindResponse);
      }
      
      while (attempts < MAX_RETRIES) {
        try {
          const pollResult = await pollGenerationStatus(pollUrl || segmindResponse?.poll_url || '');
          const status = pollResult.status?.toUpperCase();
          
          // Update generation status message
          if (status === 'QUEUED') {
            setGenerationStatus('Queued...');
            console.log('Generation queued');
          } else if (status === 'PROCESSING') {
            setGenerationStatus('Generating... This could take a couple of mins, but the laugh will be worth it.');
            console.log('Generation processing');
          }

          if (status === 'COMPLETED' && pollResult.output?.[0]) {
            console.log('Generation completed successfully!');
            
            await deductCredit();
            await updateGenerationStatus(generation.id, 'generation_completed', {
              generated_image_url: pollResult.output[0]
            });
            setIsGenerating(false);
            navigate('/generation', {
              state: { 
                generatedImageUrl: pollResult.output[0],
                bestieName,
                generationId: generation.id 
              }
            });
            return;
          }

          if (status === 'FAILED' || pollResult.error) {
            setIsGenerating(false);
            setGenerationStatus('Generation failed. Please try again later.');
            await updateGenerationStatus(generation.id, 'generation_failed', {
              error_message: pollResult.error || 'Generation failed'
            });
            setError(pollResult.error || 'Generation failed');
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
          attempts++;

        } catch (error) {
          setIsGenerating(false);
          setError('Failed to check generation status');
          return;
        }
      }
      await updateGenerationStatus(generation.id, 'generation_timeout', {
        error_message: 'Generation timed out after 20 minutes'
      });
      setGenerationStatus('Generation failed. Please try again later.');
      setIsGenerating(false);
      throw new Error('Generation timed out after 20 minutes');
    } catch (error) {
      setIsGenerating(false);
      setGenerationStatus('Generation failed. Please try again later.');
      setError(error instanceof Error ? error.message : 'Failed to generate caricature');
      console.error('Generation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-purple"
          >
            <ArrowLeft size={24} />
            Back
          </button>
        </div>
        <div className={`bg-white rounded-full px-4 py-2 text-sm ${
          credits && credits < 2 ? 'text-red-500' : 'text-primary-purple'
        }`}>
          {isLoadingCredits ? '...' : `${credits || 0} credits remaining`}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary-purple mb-2">
          Caturing {bestieName} ✨
        </h1>
        
        <div className="bg-white rounded-3xl p-4 shadow-lg mb-6 aspect-square">
          <img
            src={croppedImageUrl}
            alt="Selected"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <h2 className="text-2xl font-bold text-primary-purple mb-4">
          Choose a Style
        </h2>

        {error ? (
          <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div 
            className="overflow-x-auto mb-6 -mx-4 px-4 touch-pan-x snap-x snap-mandatory"
            onTouchStart={(e) => {
              const slider = e.currentTarget;
              const startX = e.touches[0].pageX - slider.offsetLeft;
              const scrollLeft = slider.scrollLeft;
              
              const handleTouchMove = (e: TouchEvent) => {
                const x = e.touches[0].pageX - slider.offsetLeft;
                const walk = (x - startX);
                slider.scrollLeft = scrollLeft - walk;
              };
              
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
              };
              
              document.addEventListener('touchmove', handleTouchMove);
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <div className="flex gap-4 pb-4 snap-x snap-mandatory">
              {isLoading ? Array(4).fill(0).map((_, index) => (
                <div
                  key={index}
                  className="flex-none bg-white rounded-2xl p-3 w-32 animate-pulse"
                >
                  <div className="aspect-square mb-2 bg-gray-200 rounded-xl" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
              )) : styles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => setSelectedStyle(style.name)}
                  className={`flex-none bg-white rounded-2xl p-3 w-32 transition-all snap-center ${
                    selectedStyle === style.name
                      ? 'ring-4 ring-primary-purple scale-95'
                      : 'hover:scale-95'
                  }`}
                >
                  <div className="aspect-square mb-2">
                    <img
                      onLoad={() => console.log('Style image loaded:', style.name, style.url)}
                      onError={(e) => {
                        console.error(`Failed to load image: ${style.name}`, style.url);
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dy=".3em" fill="%23999">Failed to load</text></svg>';
                      }}
                      src={style.url || ''}
                      alt={getStyleName(style.name)}
                      className="w-full h-full object-contain rounded-xl"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-center text-primary-purple">
                    {getStyleName(style.name)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {generationStatus && (
          <p className="text-center text-primary-purple mb-4">
            {generationStatus}
          </p>
        )}

        <button
          onClick={() => handleGenerate()}
          disabled={!selectedStyle || isGenerating}
          className="w-full bg-[#D2691E] text-white rounded-full py-4 px-8 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>
      <DebugConsole />
    </div>
  );
}