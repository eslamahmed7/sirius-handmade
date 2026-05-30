import { supabaseUrl, supabaseAnonKey } from './supabase';

export async function uploadImage(file: File): Promise<string | null> {
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

  // Fallback to base64 if Edge function is not deployed or fails
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
