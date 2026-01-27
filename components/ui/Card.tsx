import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-zinc-200 bg-white shadow-sm
        dark:border-zinc-800 dark:bg-zinc-900
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`flex flex-col gap-1.5 p-6 pb-0 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = '',
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div
      className={`flex items-center gap-2 border-t border-zinc-200 p-6 pt-4 dark:border-zinc-800 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
