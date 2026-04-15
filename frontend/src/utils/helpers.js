export const truncateText = (text, maxLength = 200) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getPostTypeColor = (type) => {
  const colors = {
    blog: 'bg-blue-100 text-blue-800',
    repo: 'bg-green-100 text-green-800',
    repository: 'bg-green-100 text-green-800',
    video: 'bg-red-100 text-red-800',
    podcast: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const getPostTypeIcon = (type) => {
  const icons = {
    blog: '📝',
    repo: '💻',
    repository: '💻',
    video: '🎥',
    podcast: '🎙️',
  };
  return icons[type] || '📄';
};
