// Utility to upload files to ImageKit from the browser using fetch
// Requires NEXT_PUBLIC_IMAGEKIT_UPLOAD_PRESET in your .env.local
import axios from 'axios';

export async function uploadToImageKit(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

  // 1. Get auth params from your backend
  const authRes = await fetch('/api/imagekit-auth');
  const { signature, expire, token } = await authRes.json();

  // 2. Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('publicKey', publicKey);
  formData.append('fileName', file.name);
  formData.append('folder', folder);
  formData.append('signature', signature);
  formData.append('expire', expire);
  formData.append('token', token);

  // 3. Upload to ImageKit with progress
  const response = await axios.post(
    'https://upload.imagekit.io/api/v1/files/upload',
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    }
  );

  return response.data.url;
} 