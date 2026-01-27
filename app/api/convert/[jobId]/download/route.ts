import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, getBackendHeaders } from '@/lib/api/proxy';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/convert/[jobId]/download
 * Proxy pour télécharger le fichier XML
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;

    const response = await fetch(getBackendUrl(`/api/v1/convert/${jobId}/download`), {
      method: 'GET',
      headers: getBackendHeaders(),
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: `Erreur HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const headers = new Headers();

    // Copier les headers pertinents de la réponse
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Proxy] Download error:', error);
    return NextResponse.json(
      { detail: 'Erreur lors du téléchargement' },
      { status: 502 }
    );
  }
}
