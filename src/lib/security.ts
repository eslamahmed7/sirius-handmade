// Input sanitization and validation utilities

export function sanitizeHtml(str: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return String(str).replace(/[&<>"'/]/g, (c) => map[c]);
}

export function sanitizeText(str: string): string {
  return String(str).replace(/[<>"'&]/g, '').trim();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s+()-]{7,15}$/.test(phone);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 6) errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  if (password.length > 128) errors.push('كلمة المرور طويلة جداً');
  return { valid: errors.length === 0, errors };
}

export function validateRequired(value: string, field: string): string | null {
  if (!value || !value.trim()) return `${field} مطلوب`;
  return null;
}

export function validatePrice(value: string): string | null {
  const num = Number(value);
  if (isNaN(num) || num < 0) return 'السعر غير صالح';
  return null;
}

export function validateSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '...';
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}
