import React, { useRef, useState, useEffect } from 'react';
import { Camera, RotateCcw, X, Check } from 'lucide-react';
import './CameraCapture.css';

const CameraCapture = ({ isOpen, onClose, onCapture, title = "Capture Payment Receipt" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !stream) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stopCamera();
      }
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage({
            blob,
            url: imageUrl,
            timestamp: new Date().toISOString()
          });
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const retakeImage = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleClose = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        <div className="camera-modal-header">
          <h2>{title}</h2>
          <button onClick={handleClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="camera-content">
          {error ? (
            <div className="camera-error">
              <p>{error}</p>
              <button onClick={startCamera} className="retry-btn">
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : capturedImage ? (
            <div className="captured-image-container">
              <img 
                src={capturedImage.url} 
                alt="Captured receipt" 
                className="captured-image"
              />
              <div className="capture-actions">
                <button onClick={retakeImage} className="retake-btn">
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button onClick={confirmCapture} className="confirm-btn">
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {isCameraActive && (
                <div className="camera-overlay">
                  <div className="camera-frame">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                  <p className="camera-instruction">
                    Position the receipt within the frame
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {!capturedImage && isCameraActive && (
          <div className="camera-controls">
            <button onClick={captureImage} className="capture-btn">
              <Camera className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;






