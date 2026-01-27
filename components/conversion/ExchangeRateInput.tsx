'use client';

import { useCallback, useEffect, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { useGuceRates } from '@/hooks/useGuceRates';
import type { GuceCurrency } from '@/types/guce';

interface ExchangeRateInputProps {
  /** Valeur actuelle du taux */
  value: string;
  /** Callback quand la valeur change */
  onChange: (value: string) => void;
  /** Devise selectionnee */
  currency: GuceCurrency;
  /** Callback quand la devise change */
  onCurrencyChange: (currency: GuceCurrency) => void;
  /** Desactiver le champ */
  disabled?: boolean;
}

export function ExchangeRateInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  disabled = false,
}: ExchangeRateInputProps) {
  const { rate, rates, isLoading, error, fromCache, fetchRates, selectCurrency } = useGuceRates(currency);

  /**
   * Synchronise la devise interne avec la prop
   */
  useEffect(() => {
    selectCurrency(currency);
  }, [currency, selectCurrency]);

  /**
   * Auto-remplir le champ quand le taux est charge
   */
  useEffect(() => {
    if (rate !== null) {
      onChange(rate.toString());
    }
  }, [rate, onChange]);

  /**
   * Gere le changement de valeur du champ
   */
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Accepter les nombres decimaux
      if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
        onChange(inputValue);
      }
    },
    [onChange]
  );

  /**
   * Gere le clic sur le bouton de devise
   */
  const handleCurrencyClick = useCallback(
    (newCurrency: GuceCurrency) => {
      if (newCurrency !== currency) {
        onCurrencyChange(newCurrency);
        // Appliquer automatiquement le taux de la nouvelle devise
        const newRate = rates.find((r) => r.currency === newCurrency)?.rate;
        if (newRate !== undefined) {
          onChange(newRate.toString());
        }
      }
    },
    [currency, onCurrencyChange, onChange, rates]
  );

  /**
   * Gere le clic sur le bouton rafraichir
   */
  const handleRefresh = useCallback(() => {
    fetchRates(true);
    // Effacer la valeur pour permettre l'auto-remplissage avec le nouveau taux
    onChange('');
  }, [fetchRates, onChange]);

  /**
   * Applique le taux GUCE au champ
   */
  const handleApplyRate = useCallback(() => {
    if (rate !== null) {
      onChange(rate.toString());
    }
  }, [rate, onChange]);

  // Formater la date du jour en francais
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Message d'aide dynamique
  let helpText = 'Taux de change communique par la douane';
  if (rate !== null) {
    helpText = `Taux GUCE du ${formattedDate}: ${rate.toFixed(2)} XOF/${currency}${fromCache ? ' (cache)' : ''}`;
  } else if (error && !value) {
    helpText = 'Saisie manuelle requise';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Taux de change douanier (XOF/{currency})
      </label>

      {/* Selecteur de devise */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleCurrencyClick('USD')}
          disabled={disabled}
          className={`
            flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
            ${
              currency === 'USD'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `.trim()}
        >
          USD
        </button>
        <button
          type="button"
          onClick={() => handleCurrencyClick('EUR')}
          disabled={disabled}
          className={`
            flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
            ${
              currency === 'EUR'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `.trim()}
        >
          EUR
        </button>
      </div>

      {/* Champ de saisie avec bouton rafraichir */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            name="tauxDouane"
            type="text"
            inputMode="decimal"
            placeholder={isLoading ? 'Chargement...' : 'ex: 655.96'}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            error={error && !value ? error : undefined}
            required
          />
        </div>

        {/* Bouton rafraichir */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={disabled || isLoading}
          title="Actualiser le taux GUCE"
          className={`
            px-3 py-2 rounded-lg border transition-colors
            border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800
            dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200
            ${disabled || isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `.trim()}
        >
          {isLoading ? (
            <svg
              className="h-5 w-5 animate-spin"
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
          ) : (
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
          )}
        </button>
      </div>

      {/* Message d'aide ou erreur */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{helpText}</p>

        {/* Bouton pour appliquer le taux GUCE si different */}
        {rate !== null && value && parseFloat(value) !== rate && (
          <button
            type="button"
            onClick={handleApplyRate}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Appliquer {rate.toFixed(2)}
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {error && value && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
      )}
    </div>
  );
}
