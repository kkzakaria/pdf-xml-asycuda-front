import type { GuceExchangeRate, GuceCurrency } from '@/types/guce';

/**
 * URL de base pour l'export des taux de douane GUCE
 */
const GUCE_EXPORT_URL = 'https://guce.gouv.ci/customs/rates/export';

/**
 * Formate une date en format francais DD/MM/YYYY
 */
function formatDateFrench(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Construit l'URL GUCE avec les parametres de date
 */
function buildGuceUrl(date: Date): string {
  const formattedDate = formatDateFrench(date);
  const params = new URLSearchParams({
    dov: formattedDate,
    'dov.operation': 'VALIDITY',
    format: 'csv',
  });
  return `${GUCE_EXPORT_URL}?${params.toString()}`;
}

/**
 * Parse une ligne CSV avec gestion des guillemets
 * Format GUCE: "Code","Nom","Taux de change","Ref"
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Ajouter la derniere valeur
  values.push(current.trim());

  return values;
}

/**
 * Parse le CSV GUCE en objets GuceExchangeRate
 * Format reel: "Code","Nom","Taux de change","Ref"
 * Separateur: virgule, valeurs entre guillemets
 * Taux au format francais (virgule decimale)
 */
export function parseGuceCsv(csv: string): GuceExchangeRate[] {
  const rates: GuceExchangeRate[] = [];
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    return rates;
  }

  // Premiere ligne = entetes
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  // Trouver les indices des colonnes
  // Format GUCE: "Code","Nom","Taux de change","Ref"
  const currencyIndex = headers.findIndex(
    (h) => h.includes('code') || h.includes('devise') || h.includes('currency')
  );
  const rateIndex = headers.findIndex(
    (h) => h.includes('taux') || h.includes('rate') || h.includes('cours')
  );

  if (currencyIndex === -1 || rateIndex === -1) {
    console.error('[GUCE] Colonnes requises non trouvees dans le CSV:', headers);
    return rates;
  }

  // Parser les lignes de donnees
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(line);

    if (values.length <= Math.max(currencyIndex, rateIndex)) {
      continue;
    }

    const currency = values[currencyIndex].toUpperCase();

    // Ne garder que USD et EUR
    if (currency !== 'USD' && currency !== 'EUR') {
      continue;
    }

    // Parser le taux (format francais avec virgule decimale -> remplacer par point)
    const rateStr = values[rateIndex].replace(',', '.');
    const rate = parseFloat(rateStr);

    if (isNaN(rate) || rate <= 0) {
      continue;
    }

    // Date de validite = date de la requete (pas dans le CSV)
    const today = new Date();
    const validityDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    rates.push({
      currency: currency as GuceCurrency,
      rate,
      validityDate,
    });
  }

  return rates;
}

/**
 * Recupere les taux de change depuis le site GUCE
 * Note: Le serveur GUCE accepte les requetes avec User-Agent "curl" sans redirection SSO
 * @param date Date pour laquelle recuperer les taux (defaut: aujourd'hui)
 */
export async function fetchGuceRates(date: Date = new Date()): Promise<GuceExchangeRate[]> {
  const url = buildGuceUrl(date);

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/csv, text/plain, */*',
      // User-Agent curl permet d'eviter la redirection SSO
      'User-Agent': 'curl/8.5.0',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[GUCE] Response not OK:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    throw new Error(`GUCE API error: ${response.status} ${response.statusText}`);
  }

  const csv = await response.text();

  if (!csv || csv.trim().length === 0) {
    throw new Error('GUCE API returned empty response');
  }

  return parseGuceCsv(csv);
}

/**
 * Extrait le taux USD/XOF depuis la liste des taux
 */
export function getUsdRate(rates: GuceExchangeRate[]): number | null {
  const usdRate = rates.find((r) => r.currency === 'USD');
  return usdRate?.rate ?? null;
}

/**
 * Extrait le taux EUR/XOF depuis la liste des taux
 */
export function getEurRate(rates: GuceExchangeRate[]): number | null {
  const eurRate = rates.find((r) => r.currency === 'EUR');
  return eurRate?.rate ?? null;
}

/**
 * Extrait le taux pour une devise specifique
 */
export function getRateByCurrency(
  rates: GuceExchangeRate[],
  currency: GuceCurrency
): number | null {
  const rate = rates.find((r) => r.currency === currency);
  return rate?.rate ?? null;
}
