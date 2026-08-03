export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return { valid: false, error: 'URL is required' };
  
  try {
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(formatted);
    
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'Please enter a valid domain name (e.g. example.com)' };
    }
    
    return { valid: true, error: null, url: formatted };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  // Requires at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

export const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

