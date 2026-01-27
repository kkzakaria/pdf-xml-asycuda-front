import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, getBackendHeaders } from '@/lib/api/proxy';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/convert/[jobId]
 * Proxy pour récupérer le statut d'un job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;

    const response = await fetch(getBackendUrl(`/api/v1/convert/${jobId}`), {
      method: 'GET',
      headers: getBackendHeaders(),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Get job status error:', error);
    return NextResponse.json(
      { detail: 'Erreur lors de la récupération du statut' },
      { status: 502 }
    );
  }
}
