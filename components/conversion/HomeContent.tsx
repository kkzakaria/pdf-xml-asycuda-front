'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { FileUploader } from '@/components/conversion/FileUploader';
import { ConversionForm } from '@/components/conversion/ConversionForm';
import { ChassisConflictDialog } from '@/components/conversion/ChassisConflictDialog';
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

  const showChassisDialog = state.status === 'chassis_conflict' && state.chassisConflict !== null;

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

      {showChassisDialog && state.chassisConflict && (
        <ChassisConflictDialog
          conflict={state.chassisConflict}
          onForce={forceReprocess}
          onCancel={handleReset}
        />
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
