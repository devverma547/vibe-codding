import React from 'react';

/**
 * Loading skeleton placeholder component.
 */
export const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return { width: width || '40px', height: height || '40px', borderRadius: '50%' };
      case 'card':
        return { width: width || '100%', height: height || '120px', borderRadius: 'var(--radius-md, 10px)' };
      case 'text':
      default:
        return { width: width || '100%', height: height || '16px', borderRadius: 'var(--radius-sm, 6px)' };
    }
  };

  const style = getVariantStyles();
  
  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`bg-surface relative overflow-hidden ${className}`}
      style={{ ...style, marginBottom: i < count - 1 ? '8px' : '0' }}
    >
      <div 
        className="absolute inset-0 -translate-x-full"
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'shimmer 1.5s infinite'
        }}
      />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  ));

  return count === 1 ? skeletons[0] : <div>{skeletons}</div>;
};

export default Skeleton;
