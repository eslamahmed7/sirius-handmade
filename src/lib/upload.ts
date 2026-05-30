import { supabaseUrl, supabaseAnonKey } from './supabase';

export async function uploadImage(file: File): Promise<string | null> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Try direct Cloudinary upload if config is present
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) return data.secure_url;
      }
    } catch (err) {
      console.warn('Direct Cloudinary upload failed, trying Supabase:', err);
    }
  }

  // Try Supabase Edge Function upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${supabaseUrl}/functions/v1/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseAnonKey}` },
      body: formData,
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (err) {
    console.warn('Edge function upload failed, falling back to Base64:', err);
  }

  // Fallback to base64 if both fail
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
