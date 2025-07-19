// Utility to upload files to ImageKit from the browser using fetch
// Requires NEXT_PUBLIC_IMAGEKIT_UPLOAD_PRESET in your .env.local

export async function uploadToImageKit(file: File, folder: string): Promise<string> {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
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

  // 3. Upload to ImageKit
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ImageKit upload error:', errorText);
    throw new Error('Upload failed: ' + errorText);
  }
  const data = await response.json();
  return data.url;
} 