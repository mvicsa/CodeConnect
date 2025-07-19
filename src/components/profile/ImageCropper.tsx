import React, { useState, useRef, useCallback } from 'react';
import AvatarEditor from 'react-avatar-editor';
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

const ImageCropper = ({ image, type, onSave, onCancel, className }: ImageCropperProps) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<AvatarEditor | null>(null);

  const handleSave = useCallback(async () => {
    if (editorRef.current) {
      try {
        setLoading(true);
        
        // Get the cropped canvas
        const canvas = editorRef.current.getImageScaledToCanvas();
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.95);
        });
        
        // Create a File from the blob
        const file = new File([blob], `${type}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Upload to ImageKit
        const url = await uploadToImageKit(file, '/users');
        
        // Pass the URL back to the parent component
        onSave(url);
      } catch (error) {
        console.error('Error saving image:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [editorRef, type, onSave]);

  // Determine dimensions based on type
  const getDimensions = () => {
    if (type === 'avatar') {
      return {
        width: 250,
        height: 250,
        border: 50,
        borderRadius: 125
      };
    } else {
      return {
        width: 500,
        height: 200,
        border: [50, 20],
        borderRadius: 0
      };
    }
  };

  const dimensions = getDimensions();

  if (!image) return null;

  return (
    <div className={cn("flex flex-col items-center p-4 bg-background border rounded-lg shadow-md", className)}>
      <div className="mb-4">
        <AvatarEditor
          ref={editorRef}
          image={image}
          {...dimensions}
          color={[0, 0, 0, 0.6]} // RGBA
          scale={scale}
          rotate={rotate}
        />
      </div>
      
      <div className="w-full space-y-4 px-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Zoom</label>
          <Slider
            value={[scale]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(values) => setScale(values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Rotate</label>
          <Slider
            value={[rotate]}
            min={0}
            max={360}
            step={1}
            onValueChange={(values) => setRotate(values[0])}
          />
        </div>
        
        <div className="flex justify-between pt-4">
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