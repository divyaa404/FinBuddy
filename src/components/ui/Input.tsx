import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  themeContext?: 'vessel' | 'light';
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  themeContext = 'vessel',
  error,
  className = '',
  id,
  ...props
}) => {
  const inputBase = 'w-full px-4 py-2.5 rounded-lg text-sm transition-all outline-none duration-200';
  
  const themes = {
    vessel: 'bg-[#222222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green placeholder-white/30',
    light: 'bg-white text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface/40'
  };

  const idToUse = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label 
          htmlFor={idToUse} 
          className={`font-hanken text-xs font-semibold uppercase tracking-wider ${
            themeContext === 'vessel' ? 'text-white/60' : 'text-on-surface-variant'
          }`}
        >
          {label}
        </label>
      )}
      <input
        id={idToUse}
        className={`${inputBase} ${themes[themeContext]} ${error ? 'border-error focus:ring-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-error font-medium mt-0.5">{error}</span>
      )}
    </div>
  );
};
