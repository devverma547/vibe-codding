export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference === 0) {
    const hoursDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
        const minutesDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60));
        if (minutesDifference === 0) return 'just now';
        return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }
  return rtf.format(daysDifference, 'day');
};

export const formatScore = (score) => {
  if (score === null || score === undefined) return 0;
  return Math.round(score);
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600 dark:text-[#00F5A0]';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getScoreVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

export const getScoreLabel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Poor';
  return 'Critical';
};

export const getRiskLevel = (score) => {
  if (score >= 90) return 'Low';
  if (score >= 70) return 'Medium';
  if (score >= 50) return 'High';
  return 'Critical';
};

export const formatUrl = (url) => {
  if (!url) return '';
  let displayUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (displayUrl.length > 40) {
    displayUrl = displayUrl.substring(0, 37) + '...';
  }
  return displayUrl;
};
