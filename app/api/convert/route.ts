import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, getBackendHeaders } from '@/lib/api/proxy';

/**
 * POST /api/convert
 * Proxy pour la conversion synchrone
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const forceReprocess = request.headers.get('X-Force-Reprocess') === 'true';
    const backendPath = forceReprocess ? '/api/v1/convert?force_reprocess=true' : '/api/v1/convert';

    const response = await fetch(getBackendUrl(backendPath), {
      method: 'POST',
      headers: getBackendHeaders(),
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Convert sync error:', error);
    return NextResponse.json(
      { detail: 'Erreur lors de la conversion' },
      { status: 502 }
    );
  }
}
