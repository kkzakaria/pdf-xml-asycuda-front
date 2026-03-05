import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchGuceRates } from '@/lib/guce/fetchRates';
import {
  getThursdayKey,
  getCachedRate,
  getLatestCachedRate,
  saveRateToCache,
  shouldRetryFetch,
} from '@/lib/guce/cache';
import type { GuceRatesResponse, GuceCurrency } from '@/types/guce';

const SUPPORTED_CURRENCIES: GuceCurrency[] = ['USD', 'EUR'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currencyFilter = searchParams.get('currency')?.toUpperCase() as GuceCurrency | undefined;
    const requestedRefresh = searchParams.get('refresh') === 'true';

    // Force refresh réservé aux admins
    let forceRefresh = false;
    if (requestedRefresh) {
      const session = await auth();
      if (session?.user?.role === 'admin') {
        forceRefresh = true;
      }
    }

    const thursdayDate = getThursdayKey();

    // 1. Chercher en DB pour le jeudi de référence
    const cachedEntries = (
      await Promise.all(SUPPORTED_CURRENCIES.map((c) => getCachedRate(c, thursdayDate)))
    ).filter((e): e is NonNullable<typeof e> => e !== null);

    const hasAllFromGuce = SUPPORTED_CURRENCIES.every((c) =>
      cachedEntries.some((e) => e.currency === c && e.source === 'guce')
    );

    // 2. Cache complet depuis GUCE et pas de force refresh → retourner
    if (!forceRefresh && hasAllFromGuce) {
      let rates = cachedEntries.map((e) => ({
        currency: e.currency as GuceCurrency,
        rate: e.rate,
        validityDate: e.thursdayDate,
        source: e.source as 'guce' | 'admin' | 'manual',
      }));
      if (currencyFilter) rates = rates.filter((r) => r.currency === currencyFilter);
      return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: true });
    }

    // 3. Tenter fetch GUCE si : force refresh OU (jeudi + retry autorisé)
    const retryChecks = await Promise.all(
      SUPPORTED_CURRENCIES.map((c) => shouldRetryFetch(c, thursdayDate))
    );
    const canFetch = forceRefresh || retryChecks.some(Boolean);

    if (canFetch) {
      try {
        const fetched = await fetchGuceRates();
        await Promise.all(
          fetched.map((r) =>
            saveRateToCache(r.currency as GuceCurrency, r.rate, 'guce', thursdayDate)
          )
        );
        let rates = fetched.map((r) => ({ ...r, source: 'guce' as const }));
        if (currencyFilter) rates = rates.filter((r) => r.currency === currencyFilter);
        return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: false });
      } catch (fetchError) {
        console.error('[GUCE API] Fetch from GUCE failed, falling back to DB:', fetchError);
      }
    }

    // 4. Fallback : meilleur cache disponible (jeudi courant admin OU dernier taux en DB)
    const bestEntries = cachedEntries.length > 0
      ? cachedEntries
      : (await Promise.all(SUPPORTED_CURRENCIES.map((c) => getLatestCachedRate(c)))).filter(
          (e): e is NonNullable<typeof e> => e !== null
        );

    if (bestEntries.length > 0) {
      let rates = bestEntries.map((e) => ({
        currency: e.currency as GuceCurrency,
        rate: e.rate,
        validityDate: e.thursdayDate,
        source: e.source as 'guce' | 'admin' | 'manual',
      }));
      if (currencyFilter) rates = rates.filter((r) => r.currency === currencyFilter);
      return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: true });
    }

    // 5. Aucun taux disponible
    return NextResponse.json<GuceRatesResponse>(
      {
        success: false,
        rates: [],
        error: 'Aucun taux disponible. Contactez un administrateur pour saisir le taux manuellement.',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('[GUCE API] Unexpected error:', error);
    return NextResponse.json<GuceRatesResponse>(
      {
        success: false,
        rates: [],
        error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}
