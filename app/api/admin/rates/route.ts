import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/auth/db';
import { saveRateToCache, getThursdayKey } from '@/lib/guce/cache';
import type { GuceCurrency } from '@/types/guce';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }
  return session;
}

/** GET /api/admin/rates — Taux actuels en DB (10 derniers) */
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
  const userId = session.user.id;

  await saveRateToCache(currency as GuceCurrency, rate, 'admin', thursdayDate, userId);

  return NextResponse.json({ success: true, thursdayDate });
}
