import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImageIcon, ArrowLeft } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { detectFaces, loadFaceDetectionModels } from '../services/faceDetection';
import FaceDetectionOverlay from '../components/FaceDetectionOverlay';
import { cropFaceFromImage } from '../utils/imageUtils';

interface ImageState {
  url: string;
  objectUrl: string | null;
}

export default function Upload() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detections, setDetections] = useState<faceapi.FaceDetection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelectFaceText, setShowSelectFaceText] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load face detection models when component mounts
  useEffect(() => {
    async function initModels() {
      try {
        await loadFaceDetectionModels();
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setError('Failed to initialize face detection. Please refresh the page and try again.');
      } finally {
        setIsModelLoading(false);
      }
    }
    initModels();
  }, []);

  // Cleanup object URLs when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (image?.objectUrl) {
        URL.revokeObjectURL(image.objectUrl);
      }
    };
  }, [image]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size too large. Please choose an image under 5MB.');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please choose an image file.');
      }

      const objectUrl = URL.createObjectURL(file);
      setImage({ url: objectUrl, objectUrl });
      
      // Detect faces in the image
      const faces = await detectFaces(objectUrl);
      
      if (faces.length === 0) {
        setError('No faces detected in the image. Please try another photo.');
        return;
      } else if (faces.length === 1) {
        // Automatically proceed with the single face
        const croppedImageUrl = await cropFaceFromImage(objectUrl, faces[0].box);
        navigate('/bestie-details', { state: { croppedImageUrl } });
        return;
      } else {
        // Multiple faces detected, show selection UI
        setShowSelectFaceText(true);
        setDetections(faces);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      try {
        setIsProcessing(true);
        setError(null);
        setShowCamera(false);
        setImage({ url: imageSrc, objectUrl: null });
        const faces = await detectFaces(imageSrc);
        
        if (faces.length === 0) {
          setError('No faces detected in the image. Please try another photo.');
          return;
        } else if (faces.length === 1) {
          // Automatically proceed with the single face
          const croppedImageUrl = await cropFaceFromImage(imageSrc, faces[0].box);
          navigate('/bestie-details', { state: { croppedImageUrl } });
          return;
        } else {
          // Multiple faces detected, show selection UI
          setShowSelectFaceText(true);
          setDetections(faces);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
        console.error('Error processing captured image:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFaceClick = async (detection: faceapi.FaceDetection) => {
    try {
      if (!image) return;
      
      setIsProcessing(true);
      const croppedImageUrl = await cropFaceFromImage(image.url, detection.box);
      
      // Navigate to bestie details with the cropped face
      navigate('/bestie-details', { 
        state: { 
          croppedImageUrl
        }
      });
    } catch (error) {
      setError('Failed to process the selected face. Please try again.');
      console.error('Error cropping face:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-yellow p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-purple mb-6 text-sm"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-primary-purple mb-2">
          Pick Your Bestie ⭐
        </h1>
        <p className="text-primary-purple mb-8 text-sm">
          Choose a photo of your bestie to get started
        </p>

        <div className="bg-white rounded-3xl p-4 shadow-lg mb-6 aspect-square relative">
          {showCamera ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : image ? (
            <>
              <img
                src={image.url}
                alt="Selected"
                className="w-full h-full object-contain rounded-2xl"
              />
              <FaceDetectionOverlay
                imageUrl={image.url}
                detections={detections}
                onFaceClick={handleFaceClick}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm">
              <ImageIcon size={48} className="mb-2" />
              <p>Your bestie will appear here</p>
            </div>
          )}
        </div>

        {isModelLoading && (
          <div className="text-center text-primary-purple text-sm mb-4">
            Loading face detection models...
          </div>
        )}

        {isProcessing && (
          <div className="text-center text-primary-purple text-sm mb-4">
            Processing image...
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        {showSelectFaceText && (
          <div className="text-center text-primary-purple text-sm mb-4">
            Select a face to continue
          </div>
        )}

        <div className="space-y-3">
          {showCamera ? (
            <button
              onClick={handleCapture}
              disabled={isModelLoading}
              className="w-full gradient-button-pink-purple text-white rounded-full py-3 px-6 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Snap 'em 📸
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowCamera(true)}
                disabled={isModelLoading}
                className="w-full gradient-button-pink-purple text-white rounded-full py-3 px-6 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Snap 'em 📸
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isModelLoading}
                className="w-full gradient-button-blue-green text-white rounded-full py-3 px-6 text-sm font-medium flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Pick from Gallery 🎭
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}