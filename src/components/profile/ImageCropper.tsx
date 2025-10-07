import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { uploadToImageKit } from '@/lib/imagekitUpload';
import { cn } from '@/lib/utils';
import { getCroppedImg, CroppedArea } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface ImageCropperProps {
  image: string | File | null;
  type: 'avatar' | 'cover';
  onSave: (url: string) => void;
  onCancel: () => void;
  className?: string;
}

const ImageCropper = ({ image, type, onSave, onCancel, className }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [loading, setLoading] = useState(false);

  const imageUrl = typeof image === 'string' ? image : image ? URL.createObjectURL(image) : null;

  const onCropComplete = useCallback((_: CroppedArea, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels || !imageUrl) return;

    try {
      setLoading(true);

      const blob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);

      const fileExtension = type === 'avatar' ? 'png' : 'jpg';
      const file = new File(
        [blob],
        `${type}-${Date.now()}.${fileExtension}`,
        { type: fileExtension === 'png' ? 'image/png' : 'image/jpeg' }
      );

      const url = await uploadToImageKit(file, '/users');

      onSave(url);
    } catch {
      toast.error('Error saving image'); 
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageUrl, rotation, type, onSave]);

  const getAspectRatio = () => (type === 'avatar' ? 1 : 2.5);

  if (!imageUrl) return null;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="relative w-full rounded-md overflow-hidden"
        style={{ height: type === 'avatar' ? '300px' : '250px' }}
      >
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
          showGrid
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
          <Button variant="outline" onClick={onCancel} disabled={loading}>
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
