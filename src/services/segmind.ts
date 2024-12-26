import axios from 'axios';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
const SEGMIND_API_URL = 'https://api.segmind.com/workflows/6761c4d8e0630da504657249-v6';

if (!SEGMIND_API_KEY) {
  throw new Error('Missing Segmind API key');
}

interface SegmindResponse {
  poll_url: string;
  request_id: string;
  status: string;
}

interface SegmindPollResponse {
  output?: string;
  status?: string;
  error?: string | null;
  raw?: {
    output?: string;
    status?: string;
  };
}

export async function generateCaricature(inputFaceUrl: string, styleImageUrl: string) {
  try {
    console.log('Starting caricature generation...');
    console.log(`Input face URL: ${inputFaceUrl}`);
    console.log(`Style image URL: ${styleImageUrl}`);

    const { data } = await axios.post<SegmindResponse>(
      SEGMIND_API_URL,
      {
        input_face: inputFaceUrl,
        cature_style: styleImageUrl
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`Generation initiated - Request ID: ${data.request_id}`);
    console.log(`Poll URL: ${data.poll_url}`);

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    } else {
      console.error('Error generating caricature:', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    throw new Error('Failed to generate caricature');
  }
}

export async function pollGenerationStatus(pollUrl: string): Promise<SegmindPollResponse> {
  try {
    const { data } = await axios.get<SegmindPollResponse>(pollUrl, {
      headers: { 'x-api-key': SEGMIND_API_KEY }
    });

    // Log complete API response
    console.log('Complete Segmind API response:', {
      status: data.status,
      output: data.output,
      error: data.error,
      raw: data
    });

    // Normalize and log status
    const status = data.status?.toUpperCase() || 'PENDING';
    console.log(`Generation status: ${status}`);

    switch (status) {
      case 'COMPLETED':
        if (!data.output) {
          throw new Error('Generation completed but no image URL received');
        }
        
        // Parse the nested JSON string in output
        try {
          const outputData = JSON.parse(data.output);
          const imageUrl = outputData[0]?.value?.data;
          
          if (!imageUrl) {
            throw new Error('No image URL found in response');
          }
          
          console.log('Extracted image URL:', imageUrl);
          return { status: 'COMPLETED', output: [imageUrl] };
        } catch (parseError) {
          console.error('Failed to parse output JSON:', parseError);
          throw new Error('Failed to parse generation output');
        }
        
        console.log('✨ Generation completed successfully!');
        
      case 'FAILED':
        throw new Error('Generation failed: ' + (data.error || 'Unknown error'));
        
      default:
        return { status };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Polling Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    } else {
      console.error('Error polling status:', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    throw new Error('Failed to check generation status');
  }
}