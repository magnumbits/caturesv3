import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceDetectionOverlayProps {
  imageUrl: string;
  detections: faceapi.FaceDetection[];
  onFaceClick?: (detection: faceapi.FaceDetection) => void;
}

export default function FaceDetectionOverlay({ 
  imageUrl, 
  detections,
  onFaceClick 
}: FaceDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const drawDetections = async () => {
      if (!canvasRef.current || !containerRef.current) return;

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;
      await new Promise((resolve, reject) => {
        image.onload = () => {
          setImageSize({ width: image.width, height: image.height });
          resolve(null);
        };
        image.onerror = reject;
      });

      // Match canvas size to container
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      // Calculate aspect ratio
      const containerAspectRatio = container.offsetWidth / container.offsetHeight;
      const imageAspectRatio = image.width / image.height;
      
      let drawWidth, drawHeight;
      
      if (containerAspectRatio > imageAspectRatio) {
        // Container is wider than image
        drawHeight = container.offsetHeight;
        drawWidth = drawHeight * imageAspectRatio;
      } else {
        // Container is taller than image
        drawWidth = container.offsetWidth;
        drawHeight = drawWidth / imageAspectRatio;
      }
      
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Calculate scale factors
      const scaleX = drawWidth / image.width;
      const scaleY = drawHeight / image.height;
      
      // Calculate centering offsets
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw boxes for each detection
      detections.forEach((detection) => {
        const { box } = detection;
        const scaledBox = {
          x: box.x * scaleX + offsetX,
          y: box.y * scaleY + offsetY,
          width: box.width * scaleX,
          height: box.height * scaleY,
        };

        ctx.strokeStyle = '#4ade80'; // Green color
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);
      });
    };

    drawDetections();
  }, [imageUrl, detections]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onFaceClick || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const container = containerRef.current;
    if (!container) return;

    // Calculate image drawing dimensions and offsets
    const containerAspectRatio = container.offsetWidth / container.offsetHeight;
    const imageAspectRatio = imageSize.width / imageSize.height;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (containerAspectRatio > imageAspectRatio) {
      drawHeight = container.offsetHeight;
      drawWidth = drawHeight * imageAspectRatio;
      offsetX = (container.offsetWidth - drawWidth) / 2;
    } else {
      drawWidth = container.offsetWidth;
      drawHeight = drawWidth / imageAspectRatio;
      offsetY = (container.offsetHeight - drawHeight) / 2;
    }

    const scaleX = drawWidth / imageSize.width;
    const scaleY = drawHeight / imageSize.height;

    // Find clicked detection
    const clickedDetection = detections.find((detection) => {
      const { box } = detection;
      const scaledBox = { x: box.x * scaleX + offsetX, y: box.y * scaleY + offsetY, width: box.width * scaleX, height: box.height * scaleY };
      return (
        x >= scaledBox.x &&
        x <= scaledBox.x + scaledBox.width &&
        y >= scaledBox.y &&
        y <= scaledBox.y + scaledBox.height
      );
    });

    if (clickedDetection) {
      onFaceClick(clickedDetection);
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </div>
  );
}