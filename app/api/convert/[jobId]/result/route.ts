import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, getBackendHeaders } from '@/lib/api/proxy';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/convert/[jobId]/result
 * Proxy pour récupérer le résultat d'un job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;

    const response = await fetch(getBackendUrl(`/api/v1/convert/${jobId}/result`), {
      method: 'GET',
      headers: getBackendHeaders(),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Get job result error:', error);
    return NextResponse.json(
      { detail: 'Erreur lors de la récupération du résultat' },
      { status: 502 }
    );
  }
}
