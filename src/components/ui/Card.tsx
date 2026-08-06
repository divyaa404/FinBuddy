import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'vessel' | 'light';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'vessel',
  glow = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'rounded-xl overflow-hidden transition-all duration-300 relative';
  
  const variants = {
    vessel: 'bg-[#121212] text-white border border-white/[0.08] p-6',
    light: 'bg-white text-on-surface border border-outline-variant/30 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] p-6'
  };

  const glowStyle = (variant === 'vessel' && glow) 
    ? 'shadow-[0_0_20px_rgba(15,238,101,0.15)] border-neon-green/30' 
    : '';

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
