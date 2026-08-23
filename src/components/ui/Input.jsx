import React from 'react';

/**
 * Text input component with label, error, and icon support.
 */
export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  id,
  name,
  className = '',
  ...rest
}) => {
  const inputId = id || name;

  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`input-field w-full rounded-md border ${error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary'} bg-bg-secondary py-2 text-sm text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow pr-3 ${Icon ? 'pl-10' : 'pl-3'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...rest}
        />
      </div>
      {error && <p id={errorId} className="text-sm text-danger" role="alert">{error}</p>}
      {helperText && !error && <p id={helperId} className="text-sm text-text-secondary">{helperText}</p>}
    </div>
  );
};

export default Input;
