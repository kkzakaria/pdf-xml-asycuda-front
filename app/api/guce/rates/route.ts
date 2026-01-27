import { NextRequest, NextResponse } from 'next/server';
import { fetchGuceRates } from '@/lib/guce/fetchRates';
import type { GuceRatesResponse, GuceExchangeRate } from '@/types/guce';

/**
 * Cache en memoire pour les taux GUCE
 * Cle: date au format YYYY-MM-DD
 */
interface CacheEntry {
  rates: GuceExchangeRate[];
  timestamp: number;
}

const ratesCache = new Map<string, CacheEntry>();

/**
 * Duree du cache en millisecondes (defaut: 30 minutes)
 */
const CACHE_DURATION_MS = (parseInt(process.env.GUCE_RATE_CACHE_MINUTES || '30', 10) || 30) * 60 * 1000;

/**
 * Formate une date en cle de cache YYYY-MM-DD
 */
function getDateCacheKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * GET /api/guce/rates
 *
 * Recupere les taux de change GUCE
 *
 * Query params:
 * - date: Date au format YYYY-MM-DD (defaut: aujourd'hui)
 * - currency: Filtre par devise (USD ou EUR)
 * - refresh: Si "true", force le rafraichissement du cache
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const currencyFilter = searchParams.get('currency')?.toUpperCase();
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Parser la date ou utiliser aujourd'hui
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json<GuceRatesResponse>(
          {
            success: false,
            rates: [],
            error: 'Format de date invalide. Utilisez YYYY-MM-DD.',
          },
          { status: 400 }
        );
      }
    } else {
      targetDate = new Date();
    }

    const cacheKey = getDateCacheKey(targetDate);
    let fromCache = false;

    // Verifier le cache
    const cached = ratesCache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION_MS) {
      fromCache = true;
      let rates = cached.rates;

      // Filtrer par devise si demande
      if (currencyFilter && (currencyFilter === 'USD' || currencyFilter === 'EUR')) {
        rates = rates.filter((r) => r.currency === currencyFilter);
      }

      return NextResponse.json<GuceRatesResponse>({
        success: true,
        rates,
        fromCache: true,
      });
    }

    // Fetch depuis GUCE
    let rates = await fetchGuceRates(targetDate);

    // Mettre en cache
    ratesCache.set(cacheKey, {
      rates,
      timestamp: now,
    });

    // Nettoyer les vieilles entrees du cache (garder 7 jours max)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    for (const [key, entry] of ratesCache.entries()) {
      if (entry.timestamp < sevenDaysAgo) {
        ratesCache.delete(key);
      }
    }

    // Filtrer par devise si demande
    if (currencyFilter && (currencyFilter === 'USD' || currencyFilter === 'EUR')) {
      rates = rates.filter((r) => r.currency === currencyFilter);
    }

    return NextResponse.json<GuceRatesResponse>({
      success: true,
      rates,
      fromCache,
    });
  } catch (error) {
    console.error('[GUCE API] Error fetching rates:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    return NextResponse.json<GuceRatesResponse>(
      {
        success: false,
        rates: [],
        error: `Impossible de recuperer les taux GUCE: ${errorMessage}`,
      },
      { status: 502 }
    );
  }
}
