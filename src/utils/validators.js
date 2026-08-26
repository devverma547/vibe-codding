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

    const hostParts = parsed.hostname.split('.');
    const tld = hostParts[hostParts.length - 1]?.toLowerCase();
    const isIpv4 = hostParts.length === 4 && hostParts.every(part => /^\d+$/.test(part));

    if (!isIpv4) {
      if (tld === 'a' && parsed.hostname.includes('netlify')) {
        return { valid: false, error: `Incomplete domain extension ".a". Did you mean ".app" (e.g. ${parsed.hostname}pp)?` };
      }
      if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
        return { valid: false, error: `Invalid domain extension ".${tld || ''}". Please enter a complete domain (e.g., .com, .app, .io)` };
      }
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

export const isValidGithubRepo = (repo) => {
  if (!repo || typeof repo !== 'string' || !repo.trim()) {
    return { valid: false, error: 'GitHub repository URL is required' };
  }
  const trimmed = repo.trim();
  const repoRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/;
  const match = trimmed.match(repoRegex);
  if (match) {
    return {
      valid: true,
      error: null,
      owner: match[1],
      repo: match[2],
      url: `https://github.com/${match[1]}/${match[2]}`
    };
  }
  const shortRegex = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;
  const shortMatch = trimmed.match(shortRegex);
  if (shortMatch) {
    return {
      valid: true,
      error: null,
      owner: shortMatch[1],
      repo: shortMatch[2],
      url: `https://github.com/${shortMatch[1]}/${shortMatch[2]}`
    };
  }
  return { valid: false, error: 'Please enter a valid GitHub repository (e.g. https://github.com/user/repo)' };
};

export const sanitizeGithubRepo = (repo) => {
  if (!repo) return '';
  const trimmed = repo.trim();
  if (!trimmed) return '';
  const res = isValidGithubRepo(trimmed);
  return res.valid ? res.url : trimmed;
};


