export interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  // Helper function to convert degrees to radians
  export const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };
  
  // Helper function to calculate rotated dimensions
  export const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };
  
  export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CroppedArea,
    rotation = 0
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
  
    await new Promise((resolve) => {
      image.onload = resolve;
    });
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      throw new Error('No 2d context');
    }
  
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );
  
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;
  
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
  
    ctx.drawImage(image, 0, 0);
  
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
  
    if (!croppedCtx) {
      throw new Error('No 2d context');
    }
  
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;
  
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
  
    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(blob);
      }, 'image/png');
    });
  };
  