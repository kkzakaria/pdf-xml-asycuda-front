'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { FileUploader } from '@/components/conversion/FileUploader';
import { ConversionForm } from '@/components/conversion/ConversionForm';
import { ConversionProgress } from '@/components/conversion/ConversionProgress';
import { ConversionResult } from '@/components/conversion/ConversionResult';
import { useApiConfig } from '@/hooks/useApiConfig';
import { useConversion } from '@/hooks/useConversion';
import { UserNav } from '@/components/auth/UserNav';
import type { ConversionMode } from '@/types/conversion';

export default function Home() {
  const { isConfigured, isLoading: configLoading, defaultMode } = useApiConfig();
  const {
    state,
    setFile,
    removeFile,
    setMode,
    setTauxDouane,
    setRapportPaiement,
    startConversion,
    reset,
    downloadResult,
  } = useConversion();

  const [tauxDouaneInput, setTauxDouaneInput] = useState('');
  const [rapportPaiementInput, setRapportPaiementInput] = useState('');
  const [mode, setModeState] = useState<ConversionMode>(defaultMode);
  const [modeInitialized, setModeInitialized] = useState(false);

  const handleTauxDouaneChange = useCallback(
    (value: string) => {
      setTauxDouaneInput(value);
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setTauxDouane(numValue);
      }
    },
    [setTauxDouane]
  );

  const handleRapportPaiementChange = useCallback(
    (value: string) => {
      setRapportPaiementInput(value);
      setRapportPaiement(value);
    },
    [setRapportPaiement]
  );

  const handleModeChange = useCallback(
    (newMode: ConversionMode) => {
      setModeState(newMode);
      setMode(newMode);
    },
    [setMode]
  );

  const handleReset = useCallback(() => {
    reset();
    setTauxDouaneInput('');
    setRapportPaiementInput('');
    setModeState(defaultMode);
  }, [reset, defaultMode]);

  // Synchronize mode with defaultMode from settings on initial load
  useEffect(() => {
    if (!configLoading && !modeInitialized) {
      setModeState(defaultMode);
      setMode(defaultMode);
      setModeInitialized(true);
    }
  }, [configLoading, defaultMode, modeInitialized, setMode]);

  const isConverting =
    state.status === 'uploading' ||
    state.status === 'converting' ||
    state.status === 'polling';

  useEffect(() => {
    if (state.status === 'completed' || state.status === 'error') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.status]);

  if (configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-6 w-6 text-white"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Convertisseur PDF vers XML
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Format ASYCUDA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Parametres
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {!isConfigured && (
            <Alert variant="warning" className="mb-6">
              <strong>API non configurée.</strong> Veuillez aller dans{' '}
              <Link href="/settings" className="underline hover:no-underline">
                Paramètres
              </Link>{' '}
              pour configurer la connexion API avant d&apos;utiliser le convertisseur.
            </Alert>
          )}

          {state.status === 'error' && (
            <Alert
              variant="error"
              className="mb-6"
              title="Erreur de conversion"
              onDismiss={handleReset}
            >
              {state.error}
            </Alert>
          )}

          {state.status === 'completed' && state.result ? (
            <ConversionResult
              result={state.result}
              onDownload={downloadResult}
              onReset={handleReset}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fichier PDF</CardTitle>
                  <CardDescription>
                    Sélectionnez ou glissez-déposez votre fichier PDF RFCV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader
                    file={state.file}
                    onFileSelect={setFile}
                    onFileRemove={removeFile}
                    disabled={!isConfigured || isConverting}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de conversion</CardTitle>
                  <CardDescription>
                    Configurez les options de conversion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConversionForm
                    tauxDouane={tauxDouaneInput}
                    onTauxDouaneChange={handleTauxDouaneChange}
                    rapportPaiement={rapportPaiementInput}
                    onRapportPaiementChange={handleRapportPaiementChange}
                    mode={mode}
                    onModeChange={handleModeChange}
                    onSubmit={startConversion}
                    isDisabled={!isConfigured}
                    isLoading={isConverting}
                    hasFile={state.file !== null}
                  />
                </CardContent>
              </Card>

              {isConverting && (
                <div className="lg:col-span-2">
                  <ConversionProgress
                    status={state.status}
                    progress={state.progress}
                    mode={mode}
                    jobId={state.jobId}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Convertisseur PDF vers XML ASYCUDA
        </div>
      </footer>
    </div>
  );
}
