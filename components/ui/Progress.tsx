import type { HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function Progress({
  className = '',
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`flex flex-col gap-1 ${className}`.trim()} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`
          w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700
          ${sizeStyles[size]}
        `.trim()}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`
            h-full rounded-full bg-blue-600 transition-all duration-300 ease-out
            ${percentage === 100 ? 'bg-green-600' : ''}
          `.trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
