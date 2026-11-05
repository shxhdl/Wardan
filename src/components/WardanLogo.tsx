import React from 'react';

interface WardanLogoProps {
  variant?: 'gold' | 'dark' | 'olive-badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const WardanLogo: React.FC<WardanLogoProps> = ({
  variant = 'gold',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-44',
    xl: 'w-56',
  }[size];

  const src = showSubtitle
    ? '/brand/wardan-logo-trimmed.png'
    : '/brand/wardan-calligraphy-only.png';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${sizeClasses} ${className}`}
    >
      <img
        src={src}
        alt="WARDAN وردان"
        draggable={false}
        className={`w-full h-auto object-contain ${
          variant === 'dark' ? 'brightness-75 contrast-125' : ''
        }`}
      />
    </div>
  );
};
