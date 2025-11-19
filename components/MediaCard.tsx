import React from 'react';

interface MediaCardProps {
  image: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'vertical' | 'horizontal';
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  image, 
  title, 
  subtitle, 
  onClick, 
  size = 'medium',
  variant = 'vertical' 
}) => {
  const sizeClasses = {
    small: 'w-28',
    medium: 'w-36 md:w-44',
    large: 'w-48 md:w-64',
  };

  const imgHeightClasses = {
    small: 'h-28',
    medium: 'h-36 md:h-44',
    large: 'h-48 md:h-64',
  };

  if (variant === 'horizontal') {
    return (
        <div 
          onClick={onClick}
          className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer w-full"
        >
           <img 
              src={image} 
              alt={title} 
              className="w-14 h-14 rounded object-cover bg-gray-800 shadow-sm"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
              <p className="text-xs text-subsonic-secondary truncate">{subtitle}</p>
            </div>
        </div>
    )
  }

  return (
    <div 
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col gap-2 cursor-pointer group ${sizeClasses[size]}`}
    >
      <div className={`relative overflow-hidden rounded-md shadow-lg ${imgHeightClasses[size]} w-full bg-gray-800`}>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-white truncate">{title}</h3>
        <p className="text-xs text-subsonic-secondary truncate">{subtitle}</p>
      </div>
    </div>
  );
};

export default MediaCard;