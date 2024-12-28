import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadingPromise: Promise<void> | undefined;

const MODEL_BASE_PATH = '/models/face-api';

async function validateModelFiles() {
  try {
    const requiredFiles = [
      `${MODEL_BASE_PATH}/ssd_mobilenetv1_model-weights_manifest.json`,
      `${MODEL_BASE_PATH}/face_landmark_68_model-weights_manifest.json`
    ];

    await Promise.all(
      requiredFiles.map(async (file) => {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`Failed to load model file: ${file}`);
        }
      })
    );
  } catch (error) {
    throw new Error('Face detection model files are missing or corrupted. Please check the model files.');
  }
}

async function loadModels() {
  try {
    // Validate model files first
    await validateModelFiles();

    // Check if models are already loaded in the browser
    if (faceapi.nets.ssdMobilenetv1.isLoaded && faceapi.nets.faceLandmark68Net.isLoaded) {
      modelsLoaded = true;
      return;
    }

    // Set a longer timeout for slower connections
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Model loading timed out. Please check your internet connection.')), 30000);
    });

    await Promise.race([
      Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_BASE_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE_PATH),
      ]),
      timeout
    ]);

    // Verify models are loaded correctly
    const ssdParams = await faceapi.nets.ssdMobilenetv1.getParameters();
    const landmarkParams = await faceapi.nets.faceLandmark68Net.getParameters();
    
    if (!ssdParams || !landmarkParams) {
      throw new Error('Face detection models failed to initialize properly.');
    }

    modelsLoaded = true;
  } catch (error) {
    modelsLoaded = false;
    loadingPromise = undefined;
    
    const errorMessage = error instanceof Error 
      ? error.message
      : 'Failed to load face detection models. Please check your internet connection and try again.';
      
    console.error('Face detection model loading error:', error);
    throw new Error(errorMessage);
  }
}

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const TINY_FACE_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5
});

export async function loadFaceDetectionModels() {
  if (modelsLoaded) return;

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  } catch (error) {
    modelsLoaded = false;
    console.error('Face detection model loading error:', error);
    throw new Error('Failed to load face detection models. Please refresh the page and try again.');
  }
}

export async function detectFaces(imageUrl: string): Promise<faceapi.FaceDetection[]> {
  try {
    await loadFaceDetectionModels();
    
    if (!imageUrl) {
      throw new Error('No image provided for face detection.');
    }

    const img = new Image();
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image. Please try a different image or check your internet connection.'));
      img.src = imageUrl;
    });

    const loadedImg = await imageLoadPromise;

    const detections = await faceapi.detectAllFaces(loadedImg, TINY_FACE_DETECTOR_OPTIONS);
    
    if (!detections || detections.length === 0) {
      throw new Error('No faces detected in the image. Please try another photo.');
    }

    return detections;
  } catch (error) {
    console.error('Face detection error:', error);
    throw error instanceof Error ? error : new Error('Failed to process image. Please try again.');
  }
}