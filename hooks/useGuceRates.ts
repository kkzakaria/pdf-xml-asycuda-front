'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuceExchangeRate, GuceRatesResponse, GuceCurrency, GuceCacheData } from '@/types/guce';

const CACHE_KEY_PREFIX = 'guce_rates_v2_';
const LEGACY_CACHE_KEY_PREFIX = 'guce_rates_';

const CACHE_TTL_MS = 60 * 60 * 1000;

function getCachedData(currency: GuceCurrency): GuceCacheData | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = `${CACHE_KEY_PREFIX}${currency}`;
    let cached = localStorage.getItem(key);

    // Migration from legacy key
    if (!cached) {
      const legacyKey = `${LEGACY_CACHE_KEY_PREFIX}${currency}`;
      const legacyCached = localStorage.getItem(legacyKey);
      if (legacyCached) {
        localStorage.setItem(key, legacyCached);
        localStorage.removeItem(legacyKey);
        cached = legacyCached;
      }
    }

    if (!cached) return null;

    const data: GuceCacheData = JSON.parse(cached);

    if (Date.now() - data.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setCachedData(currency: GuceCurrency, rates: GuceExchangeRate[]): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${CACHE_KEY_PREFIX}${currency}`;
    const data: GuceCacheData = {
      rates,
      cachedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignorer les erreurs de localStorage (quota depasse, etc.)
  }
}

/**
 * Hook pour recuperer les taux de change GUCE.
 * Derive le taux directement depuis le parametre `currency` (pas d'etat interne).
 */
export function useGuceRates(currency: GuceCurrency = 'USD') {
  const [rates, setRates] = useState<GuceExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [rateSource, setRateSource] = useState<'guce' | 'cache' | 'admin' | null>(null);

  const rate = rates.find((r) => r.currency === currency)?.rate ?? null;

  const fetchRates = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      const url = `/api/guce/rates${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data: GuceRatesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la recuperation des taux');
      }

      setRates(data.rates);
      setFromCache(data.fromCache ?? false);

      const usdRates = data.rates.filter((r) => r.currency === 'USD');
      const eurRates = data.rates.filter((r) => r.currency === 'EUR');
      if (usdRates.length > 0) setCachedData('USD', usdRates);
      if (eurRates.length > 0) setCachedData('EUR', eurRates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);

      const cachedUsd = getCachedData('USD');
      const cachedEur = getCachedData('EUR');

      if (cachedUsd || cachedEur) {
        const cachedRates = [...(cachedUsd?.rates || []), ...(cachedEur?.rates || [])];
        if (cachedRates.length > 0) {
          setRates(cachedRates);
          setFromCache(true);
          setError(`${errorMessage} (donnees du cache utilisees)`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const cachedUsd = getCachedData('USD');
    const cachedEur = getCachedData('EUR');

    if (cachedUsd || cachedEur) {
      const cachedRates = [...(cachedUsd?.rates || []), ...(cachedEur?.rates || [])];
      if (cachedRates.length > 0) {
        setRates(cachedRates);
        setFromCache(true);
        setRateSource('cache');
      }
    }

    fetchRates();
  }, [fetchRates]);

  // Met à jour rateSource quand la devise sélectionnée ou les taux changent
  useEffect(() => {
    if (rates.length === 0) {
      setRateSource(null);
      return;
    }
    const currentRate = rates.find((r) => r.currency === currency);
    if (currentRate?.source === 'guce') {
      setRateSource('guce');
    } else if (currentRate?.source === 'admin') {
      setRateSource('admin');
    } else {
      setRateSource(fromCache ? 'cache' : null);
    }
  }, [currency, rates, fromCache]);

  return {
    rate,
    rates,
    isLoading,
    error,
    fromCache,
    rateSource,
    fetchRates,
    clearError,
  };
}
