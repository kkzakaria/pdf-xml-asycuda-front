# GUCE Thursday-aware Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer le cache en mémoire éphémère des taux GUCE par un cache persistant en DB aligné sur le cycle jeudi, avec fallback admin global et saisie manuelle utilisateur.

**Architecture:** Cache DB (`ExchangeRateCache` Prisma) comme source de vérité. La route API calcule le "jeudi de référence" courant et cherche d'abord en DB. Si c'est jeudi et pas encore mis à jour, elle tente un fetch GUCE puis retente au maximum une fois par heure. Le panneau admin permet de saisir un taux de secours global. Le localStorage client (déjà en place) garde son rôle de cache de session.

**Tech Stack:** Next.js 16 (App Router), Prisma 5 + PostgreSQL, NextAuth v5 (JWT), TypeScript, Tailwind CSS v4, pnpm

---

## Task 1 : Schéma Prisma — Modèle ExchangeRateCache

**Files:**
- Modify: `prisma/schema.prisma`

### Step 1 : Ajouter le modèle au schéma

Dans `prisma/schema.prisma`, ajouter après le modèle `User` :

```prisma
model ExchangeRateCache {
  id           String   @id @default(cuid())
  currency     String   // "USD" | "EUR"
  rate         Float
  source       String   // "guce" | "admin"
  thursdayDate String   // "YYYY-MM-DD" du jeudi de référence
  fetchedAt    DateTime @default(now())
  setBy        String?  // userId si source = "admin"
}
```

### Step 2 : Pousser la migration en DB

```bash
pnpm db:push
```

Attendu : `Your database is now in sync with your schema.`

### Step 3 : Vérifier la génération du client Prisma

```bash
pnpm exec prisma generate
```

Attendu : `✔ Generated Prisma Client`

### Step 4 : Commit

```bash
git add prisma/schema.prisma
git commit -m "feat: add ExchangeRateCache model for persistent GUCE rate storage"
```

---

## Task 2 : lib/guce/cache.ts — Utilitaires Thursday-aware

**Files:**
- Create: `lib/guce/cache.ts`

Ce fichier centralise toute la logique de calcul du jeudi et d'accès à la DB.

### Step 1 : Créer le fichier

```typescript
// lib/guce/cache.ts
import { prisma } from '@/lib/auth/db';
import type { GuceCurrency } from '@/types/guce';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Calcule le jeudi de référence pour une date donnée.
 * Si la date est un jeudi, retourne cette date.
 * Sinon, retourne le jeudi de la même semaine (passé).
 * Semaine ISO : lundi = 0, ..., jeudi = 3, ..., dimanche = 6
 */
export function getThursdayKey(date: Date = new Date()): string {
  const d = new Date(date);
  // getDay(): 0=dim, 1=lun, ..., 4=jeu, ..., 6=sam
  const day = d.getDay(); // 0-6
  // Nombre de jours à soustraire pour aller au jeudi de cette semaine
  // jeudi = 4
  // si day=4 (jeudi) → 0 jours
  // si day=5 (ven) → 1 jour
  // si day=6 (sam) → 2 jours
  // si day=0 (dim) → 3 jours
  // si day=1 (lun) → 4 jours
  // si day=2 (mar) → 5 jours
  // si day=3 (mer) → 6 jours
  const daysToSubtract = day === 0 ? 3 : day <= 4 ? day - 4 + 7 : day - 4;
  // Correction : si day < 4 (lun/mar/mer) → aller au jeudi de la semaine précédente
  // si day >= 4 (jeu/ven/sam) → aller au jeudi de cette semaine
  // si day = 0 (dim) → aller au jeudi de la semaine précédente (3 jours avant)
  const corrected = day === 0 ? 3 : day < 4 ? day + 3 : day - 4;
  d.setDate(d.getDate() - corrected);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Retourne true si aujourd'hui est jeudi
 */
export function isThursday(date: Date = new Date()): boolean {
  return date.getDay() === 4;
}

/**
 * Récupère le taux en DB pour un jeudi de référence donné.
 * Priorité : source "guce" avant "admin".
 */
export async function getCachedRate(
  currency: GuceCurrency,
  thursdayDate: string
) {
  // Chercher d'abord source=guce, puis source=admin
  const entry = await prisma.exchangeRateCache.findFirst({
    where: { currency, thursdayDate },
    orderBy: [
      { source: 'asc' }, // "admin" < "guce" alphabétiquement — on veut guce en premier
      { fetchedAt: 'desc' },
    ],
  });
  return entry ?? null;
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
 */
export async function saveRateToCache(
  currency: GuceCurrency,
  rate: number,
  source: 'guce' | 'admin',
  thursdayDate: string,
  setBy?: string
) {
  return prisma.exchangeRateCache.create({
    data: { currency, rate, source, thursdayDate, setBy: setBy ?? null },
  });
}

/**
 * Vérifie si on doit tenter un nouveau fetch GUCE.
 * Conditions : on est jeudi ET la dernière tentative guce date de > 1h.
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
```

**Note importante sur `getThursdayKey`** : le calcul de `corrected` ci-dessus est incorrect. Voici la version correcte à utiliser :

```typescript
export function getThursdayKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam
  // Aller au jeudi le plus récent passé (ou aujourd'hui si jeudi)
  // jeudi=4, si day=4 → -0, day=5 → -1, day=6 → -2, day=0 → -3, day=1 → -4+7=... non
  // Formule : daysBack = (day - 4 + 7) % 7
  const daysBack = (day - 4 + 7) % 7;
  d.setDate(d.getDate() - daysBack);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
```

Utiliser **uniquement** cette version de `getThursdayKey`. La formule `(day - 4 + 7) % 7` donne :
- dim (0) → 3 jours en arrière → jeudi précédent ✓
- lun (1) → 4 jours ✓
- mar (2) → 5 jours ✓
- mer (3) → 6 jours ✓
- jeu (4) → 0 jours → aujourd'hui ✓
- ven (5) → 1 jour ✓
- sam (6) → 2 jours ✓

### Step 2 : Vérifier la compilation TypeScript

```bash
pnpm exec tsc --noEmit
```

Attendu : aucune erreur.

### Step 3 : Commit

```bash
git add lib/guce/cache.ts
git commit -m "feat: add Thursday-aware cache utilities for GUCE rates"
```

---

## Task 3 : Mettre à jour app/api/guce/rates/route.ts

**Files:**
- Modify: `app/api/guce/rates/route.ts`

Remplacer le `Map` en mémoire par la logique Thursday-aware avec DB.

### Step 1 : Remplacer le contenu complet du fichier

```typescript
import { NextRequest, NextResponse } from 'next/server';
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
    const forceRefresh = searchParams.get('refresh') === 'true';

    const thursdayDate = getThursdayKey();

    // 1. Chercher en DB pour le jeudi de référence
    const results = await Promise.all(
      SUPPORTED_CURRENCIES.map((c) => getCachedRate(c, thursdayDate))
    );

    const cachedEntries = results.filter(Boolean);

    const hasAllCurrencies = SUPPORTED_CURRENCIES.every((c) =>
      cachedEntries.some((e) => e?.currency === c && e?.source === 'guce')
    );

    // 2. Si cache complet (guce) et pas de force refresh → retourner
    if (!forceRefresh && hasAllCurrencies) {
      let rates = cachedEntries.map((e) => ({
        currency: e!.currency as GuceCurrency,
        rate: e!.rate,
        validityDate: e!.thursdayDate,
        source: e!.source as 'guce' | 'admin',
      }));

      if (currencyFilter) {
        rates = rates.filter((r) => r.currency === currencyFilter);
      }

      return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: true });
    }

    // 3. Tenter fetch GUCE si : force refresh OU (on est jeudi ET retry autorisé)
    const canFetch =
      forceRefresh ||
      (await Promise.all(
        SUPPORTED_CURRENCIES.map((c) => shouldRetryFetch(c, thursdayDate))
      )).some(Boolean);

    if (canFetch) {
      try {
        const fetched = await fetchGuceRates();

        // Sauvegarder chaque devise en DB
        await Promise.all(
          fetched.map((r) =>
            saveRateToCache(r.currency as GuceCurrency, r.rate, 'guce', thursdayDate)
          )
        );

        let rates = fetched.map((r) => ({
          ...r,
          source: 'guce' as const,
        }));

        if (currencyFilter) {
          rates = rates.filter((r) => r.currency === currencyFilter);
        }

        return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: false });
      } catch (fetchError) {
        console.error('[GUCE API] Fetch failed, falling back to DB:', fetchError);
        // Continuer vers le fallback DB ci-dessous
      }
    }

    // 4. Fallback : dernier taux en DB (toutes sources, toutes dates)
    const fallbackResults = await Promise.all(
      SUPPORTED_CURRENCIES.map((c) => getLatestCachedRate(c))
    );

    const fallback = fallbackResults.filter(Boolean);

    if (fallback.length > 0) {
      let rates = fallback.map((e) => ({
        currency: e!.currency as GuceCurrency,
        rate: e!.rate,
        validityDate: e!.thursdayDate,
        source: e!.source as 'guce' | 'admin',
      }));

      if (currencyFilter) {
        rates = rates.filter((r) => r.currency === currencyFilter);
      }

      return NextResponse.json<GuceRatesResponse>({ success: true, rates, fromCache: true });
    }

    // 5. Aucun taux disponible
    return NextResponse.json<GuceRatesResponse>(
      { success: false, rates: [], error: 'Aucun taux disponible. Contactez un administrateur.' },
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
```

### Step 2 : Mettre à jour le type GuceRatesResponse pour inclure `source`

Dans `types/guce.ts`, ajouter le champ `source` optionnel aux rates :

```typescript
export interface GuceExchangeRate {
  currency: GuceCurrency;
  rate: number;
  validityDate: string;
  source?: 'guce' | 'admin' | 'manual'; // Nouveau
}
```

### Step 3 : Vérifier la compilation

```bash
pnpm exec tsc --noEmit
```

Attendu : aucune erreur.

### Step 4 : Commit

```bash
git add app/api/guce/rates/route.ts types/guce.ts
git commit -m "feat: replace in-memory GUCE cache with Thursday-aware DB cache"
```

---

## Task 4 : app/api/admin/rates/route.ts — Endpoint admin

**Files:**
- Create: `app/api/admin/rates/route.ts`

### Step 1 : Créer le fichier

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/auth/db';
import { saveRateToCache, getThursdayKey } from '@/lib/guce/cache';
import type { GuceCurrency } from '@/types/guce';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

/** GET /api/admin/rates — Taux actuels en DB */
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const thursdayDate = getThursdayKey();

  const rates = await prisma.exchangeRateCache.findMany({
    orderBy: { fetchedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ success: true, rates, currentThursdayDate: thursdayDate });
}

/** POST /api/admin/rates — Sauvegarder un taux manuel */
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();
  const { currency, rate } = body as { currency: string; rate: number };

  // Validation
  if (!['USD', 'EUR'].includes(currency)) {
    return NextResponse.json(
      { error: 'Devise invalide. Utiliser USD ou EUR.' },
      { status: 400 }
    );
  }

  if (typeof rate !== 'number' || rate <= 0 || !isFinite(rate)) {
    return NextResponse.json(
      { error: 'Taux invalide. Doit être un nombre positif.' },
      { status: 400 }
    );
  }

  const thursdayDate = getThursdayKey();
  const userId = (session.user as { id?: string }).id;

  await saveRateToCache(currency as GuceCurrency, rate, 'admin', thursdayDate, userId);

  return NextResponse.json({ success: true, thursdayDate });
}
```

### Step 2 : Vérifier la compilation

```bash
pnpm exec tsc --noEmit
```

Attendu : aucune erreur.

### Step 3 : Commit

```bash
git add app/api/admin/rates/route.ts
git commit -m "feat: add admin API endpoint for manual GUCE rate override"
```

---

## Task 5 : components/admin/ExchangeRateManager.tsx — UI Admin

**Files:**
- Create: `components/admin/ExchangeRateManager.tsx`
- Modify: `app/admin/page.tsx`

### Step 1 : Créer le composant

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuceCurrency } from '@/types/guce';

interface RateEntry {
  id: string;
  currency: string;
  rate: number;
  source: string;
  thursdayDate: string;
  fetchedAt: string;
  setBy: string | null;
}

interface AdminRatesData {
  rates: RateEntry[];
  currentThursdayDate: string;
}

export function ExchangeRateManager() {
  const [data, setData] = useState<AdminRatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usdRate, setUsdRate] = useState('');
  const [eurRate, setEurRate] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminRates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rates');
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      setMessage({ text: 'Erreur lors du chargement des taux', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminRates();
  }, [fetchAdminRates]);

  const handleSave = async (currency: GuceCurrency, rateStr: string) => {
    const rate = parseFloat(rateStr.replace(',', '.'));
    if (isNaN(rate) || rate <= 0) {
      setMessage({ text: 'Taux invalide', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, rate }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ text: `Taux ${currency} sauvegardé (${rate} XOF)`, type: 'success' });
        await fetchAdminRates();
      } else {
        setMessage({ text: json.error || 'Erreur', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Erreur réseau', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/guce/rates?refresh=true');
      const json = await res.json();
      if (json.success) {
        setMessage({ text: 'Taux GUCE mis à jour', type: 'success' });
        await fetchAdminRates();
      } else {
        setMessage({ text: json.error || 'Échec de la mise à jour GUCE', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Erreur réseau', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const sourceLabel = (source: string) => {
    return source === 'guce'
      ? { text: 'GUCE', className: 'bg-green-100 text-green-700' }
      : { text: 'Manuel admin', className: 'bg-orange-100 text-orange-700' };
  };

  if (isLoading) return <div className="text-sm text-gray-500">Chargement des taux...</div>;

  const currentRates = data?.rates.filter((r) => r.thursdayDate === data.currentThursdayDate) ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Taux de change GUCE</h2>
          <p className="text-sm text-gray-500">
            Jeudi de référence : {data?.currentThursdayDate ?? '—'}
          </p>
        </div>
        <button
          onClick={handleForceRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Mise à jour...' : 'Forcer la mise à jour GUCE'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Taux actuels */}
      {currentRates.length > 0 ? (
        <div className="mb-6 divide-y border rounded-lg overflow-hidden">
          {currentRates.map((entry) => {
            const label = sourceLabel(entry.source);
            return (
              <div key={entry.id} className="flex justify-between items-center px-4 py-3 bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{entry.currency}</span>
                  <span className="ml-2 text-gray-600">{entry.rate} XOF</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${label.className}`}>
                    {label.text}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.fetchedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-6 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Aucun taux pour le jeudi de référence courant. Forcer la mise à jour ou saisir manuellement.
        </p>
      )}

      {/* Saisie manuelle */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Saisie manuelle</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['USD', 'EUR'] as GuceCurrency[]).map((currency) => {
          const val = currency === 'USD' ? usdRate : eurRate;
          const setVal = currency === 'USD' ? setUsdRate : setEurRate;
          return (
            <div key={currency} className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">XOF/{currency}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`ex: ${currency === 'USD' ? '655.96' : '720.00'}`}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleSave(currency, val)}
                  disabled={isSaving || !val}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 2 : Intégrer dans app/admin/page.tsx

Ajouter l'import et le composant dans `app/admin/page.tsx`, juste après le titre `<h1>` :

```tsx
import { ExchangeRateManager } from '@/components/admin/ExchangeRateManager';
```

Et dans le JSX, avant la grille des stats :

```tsx
<ExchangeRateManager />
```

Le fichier `app/admin/page.tsx` devient (section relevant) :

```tsx
import Link from "next/link";
import { prisma } from "@/lib/auth/db";
import { ExchangeRateManager } from "@/components/admin/ExchangeRateManager";

export default async function AdminDashboard() {
  // ... (inchangé)
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Tableau de bord
      </h1>

      <div className="mb-8">
        <ExchangeRateManager />
      </div>

      {/* ... reste inchangé */}
    </div>
  );
}
```

### Step 3 : Vérifier la compilation

```bash
pnpm exec tsc --noEmit
```

Attendu : aucune erreur.

### Step 4 : Commit

```bash
git add components/admin/ExchangeRateManager.tsx app/admin/page.tsx
git commit -m "feat: add admin ExchangeRateManager UI for manual GUCE rate override"
```

---

## Task 6 : Badges source dans ExchangeRateInput

**Files:**
- Modify: `components/conversion/ExchangeRateInput.tsx`
- Modify: `hooks/useGuceRates.ts`

L'objectif est d'afficher un badge coloré selon la source du taux retourné.

### Step 1 : Exposer la source depuis useGuceRates

Dans `hooks/useGuceRates.ts`, ajouter un état `rateSource` :

```typescript
const [rateSource, setRateSource] = useState<'guce' | 'admin' | 'cache' | null>(null);
```

Dans le bloc `try` de `fetchRates`, après `setRates(data.rates)` :

```typescript
const currentRate = data.rates.find((r) => r.currency === currency);
if (currentRate?.source === 'guce') {
  setRateSource(data.fromCache ? 'cache' : 'guce');
} else if (currentRate?.source === 'admin') {
  setRateSource('admin');
} else {
  setRateSource(data.fromCache ? 'cache' : null);
}
```

Ajouter `rateSource` au retour du hook :

```typescript
return {
  rate,
  rates,
  isLoading,
  error,
  fromCache,
  rateSource,  // nouveau
  fetchRates,
  clearError,
};
```

### Step 2 : Afficher le badge dans ExchangeRateInput

Dans `components/conversion/ExchangeRateInput.tsx`, récupérer `rateSource` :

```typescript
const { rate, rates, isLoading, error, fromCache, rateSource, fetchRates } = useGuceRates(currency);
```

Ajouter une constante de badge juste avant le `return` :

```typescript
const sourceBadge = rateSource === 'guce'
  ? { text: 'GUCE', className: 'bg-green-100 text-green-700' }
  : rateSource === 'admin'
  ? { text: 'Manuel admin', className: 'bg-orange-100 text-orange-700' }
  : rateSource === 'cache'
  ? { text: 'Cache', className: 'bg-yellow-100 text-yellow-700' }
  : null;
```

Dans le JSX, remplacer le `<p>` du `helpText` par :

```tsx
<div className="flex items-center gap-2">
  {sourceBadge && (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge.className}`}>
      {sourceBadge.text}
    </span>
  )}
  <p className="text-sm text-zinc-500 dark:text-zinc-400">{helpText}</p>
</div>
```

### Step 3 : Vérifier la compilation

```bash
pnpm exec tsc --noEmit
```

Attendu : aucune erreur.

### Step 4 : Commit

```bash
git add hooks/useGuceRates.ts components/conversion/ExchangeRateInput.tsx
git commit -m "feat: add source badge to ExchangeRateInput (GUCE/Cache/Manuel admin)"
```

---

## Test manuel final

1. Démarrer le serveur : `pnpm dev`
2. Aller sur `/admin` → vérifier que le composant `ExchangeRateManager` s'affiche
3. Cliquer "Forcer la mise à jour GUCE" → vérifier que les taux apparaissent avec le badge "GUCE"
4. Saisir un taux manuel USD (ex: 600) → Sauvegarder → vérifier badge "Manuel admin"
5. Aller sur la page de conversion → vérifier que le badge s'affiche dans `ExchangeRateInput`
6. Vérifier en DB avec `pnpm db:studio` que les entrées `ExchangeRateCache` sont bien créées

## Build final

```bash
pnpm build
```

Attendu : build réussi sans erreur TypeScript ni ESLint.
