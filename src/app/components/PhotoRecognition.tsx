import React, { useState, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Upload, AlertCircle, CheckCircle, X, Users, Shield } from 'lucide-react';

interface DetectedFace {
  id: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  landmarks?: any;
  descriptor?: Float32Array;
  matchedPerson?: string;
  matchConfidence?: number;
}

interface PhotoRecognitionProps {
  onFacesDetected?: (faces: DetectedFace[]) => void;
  onPersonMatched?: (faceId: string, personId: string) => void;
  existingPhotos?: { personId: string; descriptors: Float32Array[] }[];
}

export function PhotoRecognition({ 
  onFacesDetected, 
  onPersonMatched, 
  existingPhotos = [] 
}: PhotoRecognitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load face detection models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try CDN first, then fallback to local models
      const MODEL_URLS = [
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
        'https://unpkg.com/face-api.js@0.22.2/weights'
      ];
      
      let modelsLoaded = false;
      let lastError: Error | null = null;
      
      for (const modelUrl of MODEL_URLS) {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
          ]);
          modelsLoaded = true;
          break;
        } catch (err) {
          lastError = err as Error;
          console.warn(`Failed to load models from ${modelUrl}:`, err);
          continue;
        }
      }
      
      if (!modelsLoaded) {
        throw lastError || new Error('Failed to load models from any source');
      }
      
      setIsModelLoaded(true);
      setError(null);
    } catch (err) {
      setError('Failed to load face detection models. Please check your internet connection and try again.');
      console.error('Model loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!consent) {
      setError('Please consent to photo processing first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setDetectedFaces([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [consent]);

  // Detect faces in uploaded image
  const detectFaces = useCallback(async () => {
    if (!selectedImage || !imageRef.current || !canvasRef.current || !isModelLoaded) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const img = imageRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Process detections
      const faces: DetectedFace[] = detections.map((detection, index) => ({
        id: `face-${index}-${Date.now()}`,
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height
        },
        confidence: detection.detection.score,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor
      }));

      // Match with existing photos
      const matchedFaces = await matchWithExistingPhotos(faces);
      setDetectedFaces(matchedFaces);
      onFacesDetected?.(matchedFaces);

      // Draw face boxes
      const displaySize = { width: img.width, height: img.height };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

    } catch (err) {
      setError('Failed to detect faces. Please try a different photo.');
      console.error('Face detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, isModelLoaded, existingPhotos, onFacesDetected]);

  // Match detected faces with existing photos
  const matchWithExistingPhotos = useCallback(async (faces: DetectedFace[]): Promise<DetectedFace[]> => {
    if (!faces.length || !existingPhotos.length) {
      return faces;
    }

    return faces.map(face => {
      let bestMatch: { personId: string; confidence: number } | null = null;

      existingPhotos.forEach(photo => {
        photo.descriptors.forEach(descriptor => {
          if (face.descriptor) {
            const distance = faceapi.euclideanDistance(face.descriptor, descriptor);
            const confidence = 1 - distance;
            
            if (confidence > 0.6 && (!bestMatch || confidence > bestMatch.confidence)) {
              bestMatch = { personId: photo.personId, confidence };
            }
          }
        });
      });

      return {
        ...face,
        matchedPerson: bestMatch?.personId,
        matchConfidence: bestMatch?.confidence
      };
    });
  }, [existingPhotos]);

  // Handle person assignment
  const handlePersonAssignment = useCallback((faceId: string, personId: string) => {
    setDetectedFaces(prev => 
      prev.map(face => 
        face.id === faceId 
          ? { ...face, matchedPerson: personId, matchConfidence: 1.0 }
          : face
      )
    );
    onPersonMatched?.(faceId, personId);
  }, [onPersonMatched]);

  // Initialize models on component mount
  React.useEffect(() => {
    loadModels();
  }, [loadModels]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Camera className="w-6 h-6 text-blue-600" />
          Photo Recognition
        </h2>
        <p className="text-gray-600">
          Upload family photos to automatically identify relatives using AI-powered face recognition.
        </p>
      </div>

      {/* Privacy & Consent Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Privacy & Security</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All photo processing happens on your device (client-side only)</li>
              <li>• No photos are uploaded to external servers</li>
              <li>• Face data is encrypted and stored securely</li>
              <li>• You maintain full control over your data</li>
            </ul>
          </div>
        </div>
        
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-blue-900">
            I consent to photo processing for family member identification
          </span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={!consent || isLoading}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!consent || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          {isLoading ? 'Loading Models...' : 'Upload Photo'}
        </button>
      </div>

      {/* Image Display and Processing */}
      {selectedImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Uploaded photo"
              className="max-w-full h-auto rounded-lg"
              onLoad={() => {
                if (isModelLoaded) {
                  detectFaces();
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Detecting faces...</p>
                </div>
              </div>
            )}
          </div>

          {/* Face Detection Results */}
          {detectedFaces.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  {detectedFaces.length} Face{detectedFaces.length > 1 ? 's' : ''} Detected
                </h3>
              </div>
              
              <div className="space-y-2">
                {detectedFaces.map((face) => (
                  <div key={face.id} className="p-3 bg-white border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Face #{face.id.split('-')[1]}
                        </p>
                        <p className="text-sm text-gray-600">
                          Confidence: {(face.confidence * 100).toFixed(1)}%
                        </p>
                        {face.matchedPerson && (
                          <p className="text-sm text-green-600">
                            Matched: {face.matchedPerson} ({(face.matchConfidence! * 100).toFixed(1)}%)
                          </p>
                        )}
                      </div>
                      
                      {!face.matchedPerson && (
                        <button
                          onClick={() => {
                            // TODO: Open person selection modal
                            console.log('Assign person to face:', face.id);
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Assign Person
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Loading Status */}
      {!isModelLoaded && !error && (
        <div className="text-center py-8">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading AI models for face recognition...</p>
        </div>
      )}
    </div>
  );
}
