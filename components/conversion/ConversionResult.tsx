'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MetricsDisplay } from './MetricsDisplay';
import type { ConversionResult as ConversionResultType } from '@/types/api';

interface ConversionResultProps {
  result: ConversionResultType;
  onDownload: () => void;
  onReset: () => void;
  showDetails?: boolean;
}

export function ConversionResult({
  result,
  onDownload,
  onReset,
  showDetails = false,
}: ConversionResultProps) {
  // Vue simplifiee pour les utilisateurs non-admin
  if (!showDetails) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-10 w-10 text-green-600 dark:text-green-400"
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Conversion reussie
          </h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Votre fichier XML est pret
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button variant="primary" size="lg" onClick={onDownload} className="w-full">
            <svg
              className="h-5 w-5"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Telecharger le XML
          </Button>
          <Button variant="outline" onClick={onReset} className="w-full">
            Nouvelle conversion
          </Button>
        </div>
      </div>
    );
  }

  // Vue complete pour les administrateurs
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Conversion reussie
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {result.message}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onReset}>
          <svg
            className="h-4 w-4"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Nouvelle conversion
        </Button>
      </div>

      {result.metrics && (
        <Card>
          <CardContent className="pt-6">
            <MetricsDisplay metrics={result.metrics} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Fichier XML genere
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Format: XML_AAAAMMJJ_HHMMSS.xml
                </p>
              </div>
              <Button variant="primary" onClick={onDownload}>
                <svg
                  className="h-4 w-4"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Telecharger le XML
              </Button>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Job ID:</span>
                  <span className="ml-2 font-mono text-zinc-900 dark:text-zinc-100">
                    {result.job_id}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Fichier source:</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                    {result.filename}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Temps total:</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                    {result.processing_time.toFixed(2)}s
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <svg
                    className="h-4 w-4 text-green-600 dark:text-green-400"
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-zinc-500 dark:text-zinc-400">Statut châssis :</span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Vérifié — aucun doublon détecté
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
