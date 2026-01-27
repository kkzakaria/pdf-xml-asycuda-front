'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helpText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border px-3 py-2 text-base
            transition-colors
            placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60
            dark:bg-zinc-900 dark:placeholder:text-zinc-500
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600'
            }
            ${className}
          `.trim()}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-help`} className="text-sm text-zinc-500 dark:text-zinc-400">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
