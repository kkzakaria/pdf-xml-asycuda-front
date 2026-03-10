'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { FileUploader } from '@/components/conversion/FileUploader';
import { ConversionForm } from '@/components/conversion/ConversionForm';
import { useApiConfig } from '@/hooks/useApiConfig';
import { useConversion } from '@/hooks/useConversion';
import type { ConversionMode } from '@/types/conversion';
import type { GuceCurrency } from '@/types/guce';

const ConversionResult = dynamic(
  () => import('@/components/conversion/ConversionResult').then(m => ({ default: m.ConversionResult }))
);

const ConversionProgress = dynamic(
  () => import('@/components/conversion/ConversionProgress').then(m => ({ default: m.ConversionProgress }))
);

interface HomeContentProps {
  isAdmin: boolean;
}

export function HomeContent({ isAdmin }: HomeContentProps) {
  const { isConfigured, isLoading: configLoading, defaultMode } = useApiConfig();
  const {
    state,
    setFile,
    removeFile,
    setMode,
    setTauxDouane,
    setRapportPaiement,
    startConversion,
    forceReprocess,
    reset,
    downloadResult,
  } = useConversion();

  const [tauxDouaneInput, setTauxDouaneInput] = useState('');
  const [rapportPaiementInput, setRapportPaiementInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<GuceCurrency>('USD');
  const modeInitializedRef = useRef(false);

  // Sync mode once when config finishes loading
  useEffect(() => {
    if (!configLoading && !modeInitializedRef.current) {
      setMode(defaultMode);
      modeInitializedRef.current = true;
    }
  }, [configLoading, defaultMode, setMode]);

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
      setMode(newMode);
    },
    [setMode]
  );

  const handleReset = useCallback(() => {
    reset();
    setMode(defaultMode);
    setTauxDouaneInput('');
    setRapportPaiementInput('');
    setSelectedCurrency('USD');
  }, [reset, setMode, defaultMode]);

  useEffect(() => {
    if (state.status === 'completed' || state.status === 'error') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.status]);

  const isConverting =
    state.status === 'uploading' ||
    state.status === 'converting' ||
    state.status === 'polling';

  const isChassisConflict = state.status === 'chassis_conflict' && state.chassisConflict !== null;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {!isConfigured && isAdmin && (
        <Alert variant="warning" className="mb-6">
          <strong>API non configuree.</strong> Veuillez aller dans{' '}
          <Link href="/settings" className="underline hover:no-underline">
            Parametres
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

      {isChassisConflict && state.chassisConflict && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
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
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Châssis déjà enregistré
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {state.chassisConflict.detail}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {state.chassisConflict.duplicates.map((entry) => (
                  <div
                    key={entry.chassis_number}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs dark:border-amber-700 dark:bg-amber-900/30"
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-amber-600 dark:text-amber-400">Châssis :</span>
                      <span className="font-mono font-medium text-amber-900 dark:text-amber-200">
                        {entry.chassis_number}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">Fichier source :</span>
                      <span className="truncate text-amber-900 dark:text-amber-200">
                        {entry.first_filename}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">Première vue :</span>
                      <span className="text-amber-900 dark:text-amber-200">
                        {new Date(entry.first_seen_date).toLocaleString('fr-FR')}
                      </span>
                      {entry.first_rfcv_number && (
                        <>
                          <span className="text-amber-600 dark:text-amber-400">N° RFCV :</span>
                          <span className="font-mono text-amber-900 dark:text-amber-200">
                            {entry.first_rfcv_number}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={forceReprocess}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  Forcer le retraitement
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/30"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.status === 'completed' && state.result ? (
        <ConversionResult
          result={state.result}
          onDownload={downloadResult}
          onReset={handleReset}
          showDetails={isAdmin}
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
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                rapportPaiement={rapportPaiementInput}
                onRapportPaiementChange={handleRapportPaiementChange}
                mode={state.mode}
                onModeChange={handleModeChange}
                onSubmit={startConversion}
                isDisabled={!isConfigured}
                isLoading={isConverting}
                hasFile={state.file !== null}
                showAdvancedOptions={isAdmin}
              />
            </CardContent>
          </Card>

          {isConverting && (
            <div className="lg:col-span-2">
              <ConversionProgress
                status={state.status}
                progress={state.progress}
                mode={state.mode}
                jobId={state.jobId}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
