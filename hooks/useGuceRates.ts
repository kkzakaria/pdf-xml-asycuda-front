'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuceExchangeRate, GuceRatesResponse, GuceCurrency, GuceCacheData } from '@/types/guce';

/**
 * Cle de base pour le localStorage
 */
const CACHE_KEY_PREFIX = 'guce_rates_';

/**
 * Duree du cache localStorage en millisecondes (1 heure)
 */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Recupere les donnees du cache localStorage pour une devise
 */
function getCachedData(currency: GuceCurrency): GuceCacheData | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = `${CACHE_KEY_PREFIX}${currency}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: GuceCacheData = JSON.parse(cached);

    // Verifier l'expiration
    if (Date.now() - data.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde les donnees dans le cache localStorage
 */
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
 * Hook pour recuperer les taux de change GUCE
 */
export function useGuceRates(initialCurrency: GuceCurrency = 'USD') {
  const [rates, setRates] = useState<GuceExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<GuceCurrency>(initialCurrency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  /**
   * Recupere le taux actuel pour la devise selectionnee
   */
  const rate = rates.find((r) => r.currency === selectedCurrency)?.rate ?? null;

  /**
   * Recupere les taux depuis l'API
   */
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

      // Mettre en cache pour chaque devise
      const usdRates = data.rates.filter((r) => r.currency === 'USD');
      const eurRates = data.rates.filter((r) => r.currency === 'EUR');
      if (usdRates.length > 0) setCachedData('USD', usdRates);
      if (eurRates.length > 0) setCachedData('EUR', eurRates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);

      // Essayer de recuperer depuis le cache localStorage
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

  /**
   * Change la devise selectionnee
   */
  const selectCurrency = useCallback((currency: GuceCurrency) => {
    setSelectedCurrency(currency);
  }, []);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Auto-fetch au montage du composant
   */
  useEffect(() => {
    // Essayer d'abord le cache localStorage
    const cachedUsd = getCachedData('USD');
    const cachedEur = getCachedData('EUR');

    if (cachedUsd || cachedEur) {
      const cachedRates = [...(cachedUsd?.rates || []), ...(cachedEur?.rates || [])];
      if (cachedRates.length > 0) {
        setRates(cachedRates);
        setFromCache(true);
      }
    }

    // Puis fetch depuis l'API pour avoir les donnees fraiches
    fetchRates();
  }, [fetchRates]);

  return {
    /** Taux pour la devise selectionnee */
    rate,
    /** Tous les taux disponibles */
    rates,
    /** Devise actuellement selectionnee */
    selectedCurrency,
    /** Indicateur de chargement */
    isLoading,
    /** Message d'erreur */
    error,
    /** Indique si les donnees viennent du cache */
    fromCache,
    /** Recuperer les taux (optionnel: forcer le rafraichissement) */
    fetchRates,
    /** Changer la devise selectionnee */
    selectCurrency,
    /** Effacer l'erreur */
    clearError,
  };
}
