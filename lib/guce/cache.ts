import { prisma } from '@/lib/auth/db';
import type { GuceCurrency } from '@/types/guce';

/**
 * Calcule le jeudi de référence pour une date donnée.
 * Si la date est un jeudi, retourne cette date.
 * Sinon, retourne le jeudi le plus récent (semaine courante passé).
 *
 * Formule : daysBack = (day - 4 + 7) % 7
 * où day = getDay() : 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam
 *
 * Exemples :
 *   dim (0) → (0-4+7)%7 = 3 jours en arrière → jeudi précédent ✓
 *   lun (1) → 4 jours ✓
 *   mar (2) → 5 jours ✓
 *   mer (3) → 6 jours ✓
 *   jeu (4) → 0 jours → aujourd'hui ✓
 *   ven (5) → 1 jour ✓
 *   sam (6) → 2 jours ✓
 */
export function getThursdayKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const daysBack = (day - 4 + 7) % 7;
  d.setDate(d.getDate() - daysBack);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns true if the given date is a Thursday. */
export function isThursday(date: Date = new Date()): boolean {
  return date.getDay() === 4;
}

/**
 * Récupère l'entrée en cache DB pour un jeudi de référence donné.
 * Priorité : source "guce" avant "admin" (tri alphabétique inversé : guce > admin).
 */
export async function getCachedRate(
  currency: GuceCurrency,
  thursdayDate: string
) {
  return prisma.exchangeRateCache.findFirst({
    where: { currency, thursdayDate },
    orderBy: [
      { source: 'desc' }, // "guce" > "admin" alphabétiquement
      { fetchedAt: 'desc' },
    ],
  });
}

/**
 * Récupère le taux le plus récent en DB pour une devise,
 * toutes dates confondues (fallback si aucun cache du jeudi courant).
 */
export async function getLatestCachedRate(currency: GuceCurrency) {
  return prisma.exchangeRateCache.findFirst({
    where: { currency },
    orderBy: { fetchedAt: 'desc' },
  });
}

/**
 * Sauvegarde un taux en DB.
 * Utilise upsert pour éviter les doublons (contrainte unique sur currency+thursdayDate+source).
 */
export async function saveRateToCache(
  currency: GuceCurrency,
  rate: number,
  source: 'guce' | 'admin',
  thursdayDate: string,
  setBy?: string
) {
  return prisma.exchangeRateCache.upsert({
    where: {
      currency_thursdayDate_source: { currency, thursdayDate, source },
    },
    update: { rate, fetchedAt: new Date(), setBy: setBy ?? null },
    create: { currency, rate, source, thursdayDate, setBy: setBy ?? null },
  });
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Vérifie si on doit tenter un nouveau fetch GUCE.
 * Conditions : on est jeudi ET la dernière entrée guce pour ce jeudi date de > 1h
 * (ou n'existe pas encore).
 */
export async function shouldRetryFetch(
  currency: GuceCurrency,
  thursdayDate: string
): Promise<boolean> {
  if (!isThursday()) return false;

  const lastGuce = await prisma.exchangeRateCache.findFirst({
    where: { currency, thursdayDate, source: 'guce' },
    orderBy: { fetchedAt: 'desc' },
  });

  if (!lastGuce) return true;
  return Date.now() - lastGuce.fetchedAt.getTime() > ONE_HOUR_MS;
}
