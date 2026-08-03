import React from 'react';
import { Button } from '../ui/Button';

/**
 * Empty state indicator component.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-surface/50 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
          <Icon className="w-8 h-8" />
        </div>
      )}
      {title && <h3 className="text-xl font-semibold text-text mb-2">{title}</h3>}
      {description && <p className="text-text-secondary max-w-md mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
