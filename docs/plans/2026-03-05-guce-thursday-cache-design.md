# Design : Cache Thursday-aware des taux GUCE + Fallback manuel

**Date** : 2026-03-05
**Statut** : Approuvé
**Branche** : `perf/vercel-react-best-practices`

---

## Contexte

Les taux de change GUCE (Guichet Unique du Commerce Extérieur) sont mis à jour chaque **jeudi**. Le système actuel utilise :
- Un cache en mémoire côté serveur (30 min TTL) — perdu à chaque cold start Vercel
- Un cache localStorage côté client (1h TTL)
- Aucun cache persistant aligné sur le cycle jeudi

L'objectif est de mettre en place un cache persistant en DB aligné sur les jeudis, avec fallback admin global et saisie manuelle par l'utilisateur.

---

## Architecture

### Déploiement
L'app est sur **Vercel (serverless)**. La mémoire et le système de fichiers sont éphémères. Le seul stockage persistant disponible est **PostgreSQL via Prisma**.

### Approche choisie : Cache DB on-demand Thursday-aware (Option B)
Pas de cron job. La route API gère elle-même la logique Thursday-aware avec retry automatique le jeudi.

---

## Modèle de données

Nouveau modèle Prisma `ExchangeRateCache` :

```prisma
model ExchangeRateCache {
  id           String   @id @default(cuid())
  currency     String   // "USD" | "EUR"
  rate         Float
  source       String   // "guce" | "admin"
  thursdayDate String   // Date du jeudi de référence "YYYY-MM-DD"
  fetchedAt    DateTime @default(now())
  setBy        String?  // userId si source = "admin"
}
```

---

## Logique du cache Thursday-aware

### Calcul du jeudi de référence
- Si aujourd'hui est jeudi → `thursdayDate` = aujourd'hui
- Sinon → `thursdayDate` = le jeudi de la semaine courante (passé)

### Algorithme de résolution (route GET `/api/guce/rates`)

```
1. Calculer le thursdayDate (jeudi de référence courant)

2. Chercher en DB : ExchangeRateCache WHERE thursdayDate = thursdayDate

3. Si trouvé → retourner avec fromCache: true

4. Si non trouvé ET on est jeudi ET (pas de tentative récente OU dernière > 1h)
   → Tenter fetch GUCE
   → Si succès → sauvegarder en DB (source: "guce"), retourner
   → Si échec → chercher taux admin en DB (source: "admin") comme fallback
              → Si pas de taux admin → retourner erreur

5. Si non trouvé ET on n'est PAS jeudi
   → Retourner le dernier enregistrement en DB (ORDER BY fetchedAt DESC)
   → Si DB vide → retourner erreur
```

---

## Priorité des fallbacks

| Priorité | Source | Badge UI |
|----------|--------|----------|
| 1 | Cache DB jeudi courant (source: guce) | 🟢 "GUCE" |
| 2 | Cache DB jeudi courant (source: admin) | 🟠 "Manuel admin" |
| 3 | Dernier cache DB valide (jeudi précédent) | 🟡 "Cache semaine précédente" |
| 4 | Saisie manuelle utilisateur | 🟠 "Saisie manuelle" |
| 5 | Aucun taux disponible | ❌ Erreur, champ vide |

---

## Nouveaux fichiers

### `lib/guce/cache.ts`
Fonctions utilitaires centralisées :
- `getThursdayKey(date: Date): string` — calcule le jeudi de référence
- `getCachedRate(currency): Promise<ExchangeRateCache | null>` — lit depuis DB
- `saveRateToCache(currency, rate, source, setBy?)` — écrit en DB
- `shouldRetryFetch(currency): Promise<boolean>` — true si jeudi ET dernière tentative > 1h

### `app/api/admin/rates/route.ts`
- `GET` : retourne les taux actuels en DB (admin seulement)
- `POST` : sauvegarde un taux manuel avec `source: "admin"` (admin seulement)

### `components/admin/ExchangeRateManager.tsx`
Intégré dans `app/admin/page.tsx` :
- Affiche taux actuel en DB (source, date du jeudi, fetchedAt)
- Formulaire saisie manuelle USD/EUR
- Bouton "Forcer la mise à jour depuis GUCE"

---

## Modifications des fichiers existants

### `app/api/guce/rates/route.ts`
- Remplacer le `Map` en mémoire par les appels à `lib/guce/cache.ts`
- Implémenter l'algorithme Thursday-aware décrit ci-dessus

### `hooks/useGuceRates.ts`
- Aucune modification — le localStorage 1h reste comme cache de session

### `components/conversion/ExchangeRateInput.tsx`
- Ajouter badge visuel selon la source du taux
- Ajouter prop `rateSource?: 'guce' | 'admin' | 'manual' | 'cache'`

---

## Gestion des cas limites

| Situation | Comportement |
|-----------|-------------|
| Jeudi, GUCE pas encore mis à jour (ex: 6h) | Retourne cache semaine précédente, retry silencieux toutes les heures |
| GUCE indisponible tout le jeudi | Admin saisit le taux via panneau admin |
| Cold start Vercel | DB consultée immédiatement, taux disponible |
| DB indisponible | Erreur retournée, client utilise localStorage puis saisie manuelle |
| Admin saisit un taux, GUCE redevient disponible | Fetch GUCE jeudi suivant écrase le taux admin |

---

## Sécurité

- `POST /api/admin/rates` vérifie `session.user.role === "admin"` via NextAuth
- Validation serveur : taux > 0, currency ∈ ["USD", "EUR"]
- Le `setBy` enregistre l'userId admin pour audit

---

## Ce qui ne change pas

- Le hook `useGuceRates` et son cache localStorage (1h)
- La saisie manuelle dans `ExchangeRateInput` (déjà fonctionnelle)
- L'authentification et les rôles existants
