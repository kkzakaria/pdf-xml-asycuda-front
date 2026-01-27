/**
 * Utilitaires pour le proxy API
 * Permet de relayer les requêtes vers l'API backend externe
 */

/**
 * Configuration de l'API backend
 */
export function getBackendConfig() {
  return {
    baseUrl: (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, ''),
    apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
  };
}

/**
 * Headers pour les requêtes vers le backend
 */
export function getBackendHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const config = getBackendConfig();
  return {
    'X-API-Key': config.apiKey,
    ...additionalHeaders,
  };
}

/**
 * Construit l'URL complète du backend
 */
export function getBackendUrl(path: string): string {
  const config = getBackendConfig();
  return `${config.baseUrl}${path}`;
}
