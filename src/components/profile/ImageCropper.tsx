import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { uploadToImageKit } from '@/lib/imagekitUpload';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  image: string | File | null;
  type: 'avatar' | 'cover';
  onSave: (url: string) => void;
  onCancel: () => void;
  className?: string;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper = ({ image, type, onSave, onCancel, className }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Convert File to URL if needed
  const imageUrl = typeof image === 'string' ? image : image ? URL.createObjectURL(image) : null;

  const onCropComplete = useCallback((croppedArea: CroppedArea, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Improved image cropping function
  const getCroppedImg = async (
    imageSrc: string, 
    pixelCrop: CroppedArea, 
    rotation = 0
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    
    // Create a promise to wait for the image to load
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Calculate bounding box of the rotated image
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to center of canvas
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0);

    // Extract the cropped region
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      throw new Error('No 2d context');
    }

    // Set dimensions for the cropped canvas
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return as blob
    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(blob);
      }, 'image/png'); // Use PNG to preserve transparency
    });
  };

  // Helper function to convert degrees to radians
  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  // Helper function to calculate rotated dimensions
  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels || !imageUrl) return;
    
    try {
      setLoading(true);
      
      // Get the cropped image as a blob
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
      
      // Create a File from the blob
      const fileExtension = type === 'avatar' ? 'png' : 'jpg'; // Use PNG for avatars to preserve transparency
      const file = new File(
        [blob], 
        `${type}-${Date.now()}.${fileExtension}`, 
        { type: fileExtension === 'png' ? 'image/png' : 'image/jpeg' }
      );
      
      // Upload to ImageKit
      const url = await uploadToImageKit(file, '/users');
      
      // Pass the URL back to the parent component
      onSave(url);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageUrl, rotation, type, onSave]);

  // Determine aspect ratio based on type
  const getAspectRatio = () => {
    return type === 'avatar' ? 1 : 2.5;
  };

  if (!imageUrl) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-full rounded-md overflow-hidden" style={{ height: type === 'avatar' ? '300px' : '250px' }}>
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={getAspectRatio()}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape={type === 'avatar' ? 'round' : 'rect'}
          showGrid={true}
        />
      </div>
      
      <div className="w-full space-y-4 mt-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-2">Zoom</label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(values) => setZoom(values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-3">Rotate</label>
          <Slider
            value={[rotation]}
            min={0}
            max={360}
            step={1}
            onValueChange={(values) => setRotation(values[0])}
          />
        </div>
        
        <div className="flex justify-between pt-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 