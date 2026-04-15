const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ${className}`}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-primary-700 font-semibold text-sm">
          {getInitials(alt)}
        </span>
      )}
    </div>
  );
};

export default Avatar;
