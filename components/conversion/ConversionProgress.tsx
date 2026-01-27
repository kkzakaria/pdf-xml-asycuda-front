'use client';

import { Progress } from '@/components/ui/Progress';
import type { ConversionStatus, ConversionMode } from '@/types/conversion';

interface ConversionProgressProps {
  status: ConversionStatus;
  progress: number;
  mode: ConversionMode;
  jobId?: string | null;
}

const statusMessages: Record<ConversionStatus, string> = {
  idle: 'Prêt à convertir',
  uploading: 'Envoi du fichier...',
  converting: 'Conversion PDF vers XML...',
  polling: 'Traitement en cours...',
  completed: 'Conversion terminée !',
  error: 'Échec de la conversion',
};

export function ConversionProgress({
  status,
  progress,
  mode,
  jobId,
}: ConversionProgressProps) {
  const isActive = status === 'uploading' || status === 'converting' || status === 'polling';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex h-8 w-8 items-center justify-center">
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {statusMessages[status]}
            </p>
            {mode === 'async' && jobId && status === 'polling' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Job ID: {jobId}
              </p>
            )}
          </div>
        </div>
        {isActive && (
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {isActive && (
        <Progress value={progress} size="md" />
      )}

      {status === 'polling' && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cela peut prendre quelques instants. La page se mettra à jour automatiquement une fois terminé.
        </p>
      )}
    </div>
  );
}
