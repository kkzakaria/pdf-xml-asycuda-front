'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MetricsDisplay } from './MetricsDisplay';
import type { ConversionResult as ConversionResultType } from '@/types/api';

interface ConversionResultProps {
  result: ConversionResultType;
  onDownload: () => void;
  onReset: () => void;
}

export function ConversionResult({
  result,
  onDownload,
  onReset,
}: ConversionResultProps) {
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
              Conversion réussie
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
                  Fichier XML généré
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
                Télécharger le XML
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
