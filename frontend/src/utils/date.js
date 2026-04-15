import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns';

const parseDate = (date) => {
  if (!date) return null;
  
  if (date instanceof Date) return date;
  
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const formatTimeAgo = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return 'Unknown';
  
  try {
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

export const formatDate = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return 'Unknown';
  
  try {
    return format(parsed, 'MMM dd, yyyy');
  } catch {
    return 'Unknown';
  }
};

export const formatDateTime = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return 'Unknown';
  
  try {
    return format(parsed, 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
};
