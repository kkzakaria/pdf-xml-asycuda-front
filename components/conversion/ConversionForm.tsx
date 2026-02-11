'use client';

import { useCallback, type ChangeEvent, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ExchangeRateInput } from '@/components/conversion/ExchangeRateInput';
import type { ConversionMode } from '@/types/conversion';
import type { GuceCurrency } from '@/types/guce';

const LightningIcon = (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const AsyncIcon = (
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
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

interface ConversionFormProps {
  tauxDouane: string;
  onTauxDouaneChange: (value: string) => void;
  selectedCurrency: GuceCurrency;
  onCurrencyChange: (currency: GuceCurrency) => void;
  rapportPaiement: string;
  onRapportPaiementChange: (value: string) => void;
  mode: ConversionMode;
  onModeChange: (mode: ConversionMode) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasFile: boolean;
  showAdvancedOptions?: boolean;
}

export function ConversionForm({
  tauxDouane,
  onTauxDouaneChange,
  selectedCurrency,
  onCurrencyChange,
  rapportPaiement,
  onRapportPaiementChange,
  mode,
  onModeChange,
  onSubmit,
  isDisabled = false,
  isLoading = false,
  hasFile,
  showAdvancedOptions = false,
}: ConversionFormProps) {

  const handleRapportPaiementChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onRapportPaiementChange(e.target.value);
    },
    [onRapportPaiementChange]
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onSubmit();
    },
    [onSubmit]
  );

  const isValid = hasFile && tauxDouane && parseFloat(tauxDouane) > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ExchangeRateInput
        value={tauxDouane}
        onChange={onTauxDouaneChange}
        currency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        disabled={isDisabled}
      />

      {showAdvancedOptions && (
        <>
          <Input
            label="Rapport de paiement (Optionnel)"
            name="rapportPaiement"
            type="text"
            placeholder="ex: 25P2003J"
            value={rapportPaiement}
            onChange={handleRapportPaiementChange}
            disabled={isDisabled}
            helpText="Numero de quittance du Tresor Public (si disponible)"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Mode de conversion
            </label>
            <div className="flex gap-3">
              <label
                className={`
                  flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3
                  transition-colors
                  ${
                    mode === 'sync'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}
                `.trim()}
              >
                <input
                  type="radio"
                  name="mode"
                  value="sync"
                  checked={mode === 'sync'}
                  onChange={() => onModeChange('sync')}
                  disabled={isDisabled}
                  className="sr-only"
                />
                {LightningIcon}
                <span className="text-sm font-medium">Synchrone</span>
              </label>
              <label
                className={`
                  flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3
                  transition-colors
                  ${
                    mode === 'async'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}
                `.trim()}
              >
                <input
                  type="radio"
                  name="mode"
                  value="async"
                  checked={mode === 'async'}
                  onChange={() => onModeChange('async')}
                  disabled={isDisabled}
                  className="sr-only"
                />
                {AsyncIcon}
                <span className="text-sm font-medium">Asynchrone</span>
              </label>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {mode === 'sync'
                ? 'Attendre la fin de la conversion'
                : 'Traitement en arriere-plan avec suivi de progression'}
            </p>
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={!isValid || isDisabled}
        isLoading={isLoading}
        size="lg"
        className="mt-2"
      >
        {isLoading ? 'Conversion en cours...' : 'Lancer la conversion'}
      </Button>
    </form>
  );
}
