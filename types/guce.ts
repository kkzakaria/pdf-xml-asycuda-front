/**
 * Types pour l'API GUCE (Guichet Unique du Commerce Exterieur)
 * Source: https://guce.gouv.ci/customs/rates/export
 */

/**
 * Devises supportees par le GUCE
 */
export type GuceCurrency = 'USD' | 'EUR';

/**
 * Taux de change GUCE
 */
export interface GuceExchangeRate {
  /** Code devise (USD, EUR) */
  currency: GuceCurrency;
  /** Taux de conversion vers XOF (Franc CFA) */
  rate: number;
  /** Date de validite du taux */
  validityDate: string;
  /** Source du taux */
  source?: 'guce' | 'admin' | 'manual';
}

/**
 * Reponse de l'API GUCE
 */
export interface GuceRatesResponse {
  /** Indique si la requete a reussi */
  success: boolean;
  /** Liste des taux de change */
  rates: GuceExchangeRate[];
  /** Message d'erreur si echec */
  error?: string;
  /** Indique si les donnees proviennent du cache */
  fromCache?: boolean;
}

/**
 * Donnees stockees dans le cache localStorage
 */
export interface GuceCacheData {
  /** Taux de change */
  rates: GuceExchangeRate[];
  /** Timestamp de mise en cache */
  cachedAt: number;
}
