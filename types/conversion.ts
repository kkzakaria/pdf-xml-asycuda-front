// Conversion State Types

import type { ConversionResult, JobStatus, ChassisConflictData } from './api';

export type ConversionMode = 'sync' | 'async';

export type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'converting'
  | 'polling'
  | 'completed'
  | 'error'
  | 'chassis_conflict';

export interface ConversionState {
  status: ConversionStatus;
  mode: ConversionMode;
  file: File | null;
  tauxDouane: number;
  rapportPaiement: string;
  jobId: string | null;
  result: ConversionResult | null;
  xmlBlob: Blob | null;
  error: string | null;
  progress: number;
  chassisConflict: ChassisConflictData | null;
}

export interface ConversionFormData {
  tauxDouane: string;
  rapportPaiement: string;
  mode: ConversionMode;
}

export type ConversionAction =
  | { type: 'SET_FILE'; payload: File }
  | { type: 'REMOVE_FILE' }
  | { type: 'SET_MODE'; payload: ConversionMode }
  | { type: 'SET_TAUX_DOUANE'; payload: number }
  | { type: 'SET_RAPPORT_PAIEMENT'; payload: string }
  | { type: 'START_CONVERSION' }
  | { type: 'START_POLLING'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'CONVERSION_SUCCESS'; payload: { result: ConversionResult; xmlBlob: Blob | null } }
  | { type: 'CONVERSION_ERROR'; payload: string }
  | { type: 'CHASSIS_CONFLICT'; payload: ChassisConflictData }
  | { type: 'RESET' };

export interface JobPollingState {
  isPolling: boolean;
  jobStatus: JobStatus | null;
  error: string | null;
}
