// API Client for PDF to XML ASYCUDA Conversion

import type {
  ApiConfig,
  ApiError,
  AsyncConversionResponse,
  ConversionResult,
  JobResultResponse,
  JobStatus,
} from '@/types/api';

const STORAGE_KEY = 'pdf-xml-asycuda-config-v2';
const LEGACY_STORAGE_KEY = 'pdf-xml-asycuda-config';

// Default API URL from environment variable (Render deployment)
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const DEFAULT_MODE = (process.env.NEXT_PUBLIC_DEFAULT_MODE as 'sync' | 'async') || 'async';

// In-memory cache to avoid repeated localStorage reads
let configCache: ApiConfig | null = null;

export function getDefaultConfig(): ApiConfig {
  return {
    baseUrl: DEFAULT_API_URL,
    apiKey: DEFAULT_API_KEY,
    defaultMode: DEFAULT_MODE,
  };
}

function migrateStorage(): void {
  if (typeof window === 'undefined') return;
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') {
    return getDefaultConfig();
  }

  if (configCache) return configCache;

  migrateStorage();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ApiConfig;
      const result: ApiConfig = {
        baseUrl: parsed.baseUrl || DEFAULT_API_URL,
        apiKey: parsed.apiKey || DEFAULT_API_KEY,
        defaultMode: parsed.defaultMode || DEFAULT_MODE,
      };
      configCache = result;
      return result;
    } catch {
      const defaults = getDefaultConfig();
      configCache = defaults;
      return defaults;
    }
  }
  const defaults = getDefaultConfig();
  configCache = defaults;
  return defaults;
}

export function saveApiConfig(config: ApiConfig): void {
  if (typeof window === 'undefined') return;
  configCache = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isApiConfigured(): boolean {
  const config = getApiConfig();
  return Boolean(config.baseUrl && config.apiKey);
}

export function getDefaultMode(): 'sync' | 'async' {
  const config = getApiConfig();
  return config.defaultMode || 'async';
}

class ApiClient {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json() as ApiError;
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }
    return response.json() as Promise<T>;
  }

  async convertSync(
    pdfFile: File,
    tauxDouane: number,
    rapportPaiement?: string | null
  ): Promise<ConversionResult> {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('taux_douane', tauxDouane.toString());

    if (rapportPaiement) {
      formData.append('rapport_paiement', rapportPaiement);
    }

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<ConversionResult>(response);
  }

  async convertAsync(
    pdfFile: File,
    tauxDouane: number,
    rapportPaiement?: string | null
  ): Promise<AsyncConversionResponse> {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('taux_douane', tauxDouane.toString());

    if (rapportPaiement) {
      formData.append('rapport_paiement', rapportPaiement);
    }

    const response = await fetch('/api/convert/async', {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<AsyncConversionResponse>(response);
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`/api/convert/${jobId}`, {
      method: 'GET',
    });

    return this.handleResponse<JobStatus>(response);
  }

  async getJobResult(jobId: string): Promise<JobResultResponse> {
    const response = await fetch(`/api/convert/${jobId}/result`, {
      method: 'GET',
    });

    return this.handleResponse<JobResultResponse>(response);
  }

  async downloadXml(jobId: string): Promise<Blob> {
    const response = await fetch(`/api/convert/${jobId}/download`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Échec du téléchargement : HTTP ${response.status}`);
    }

    return response.blob();
  }

  downloadXmlFromContent(xmlContent: string, filename: string): void {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const apiClient = new ApiClient();
