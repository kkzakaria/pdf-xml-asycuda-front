import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, getBackendHeaders } from '@/lib/api/proxy';

/**
 * POST /api/convert/async
 * Proxy pour la conversion asynchrone
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const forceReprocess = formData.get('_force_reprocess') === 'true';
    formData.delete('_force_reprocess');
    const backendPath = forceReprocess ? '/api/v1/convert/async?force_reprocess=true' : '/api/v1/convert/async';

    const response = await fetch(getBackendUrl(backendPath), {
      method: 'POST',
      headers: getBackendHeaders(),
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Convert async error:', error);
    return NextResponse.json(
      { detail: 'Erreur lors de la conversion asynchrone' },
      { status: 502 }
    );
  }
}
