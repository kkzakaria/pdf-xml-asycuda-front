// API Response Types for PDF to XML ASYCUDA Conversion

export interface ConversionMetrics {
  items_count: number;
  containers_count: number;
  fill_rate: number;
  warnings_count: number;
  warnings: string[];
  xml_valid: boolean;
  has_exporter: boolean;
  has_consignee: boolean;
  processing_time: number;
}

export interface ConversionResult {
  success: boolean;
  job_id: string;
  filename: string;
  output_file?: string;
  message: string;
  metrics?: ConversionMetrics;
  processing_time: number;
}

export interface ChassisConflictEntry {
  chassis_number: string;
  first_seen_date: string;
  first_filename: string;
  first_rfcv_number: string | null;
}

export interface ChassisConflictData {
  success: false;
  error: 'duplicate_chassis';
  detail: string;
  duplicates: ChassisConflictEntry[];
  hint: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  created_at: string;
  completed_at?: string;
  progress?: number;
  message: string;
  error?: string;
  duplicate_chassis?: ChassisConflictEntry[] | null;
}

export interface AsyncConversionResponse {
  job_id: string;
  status: 'pending';
  message: string;
  created_at: string;
}

export interface JobResultResponse {
  job_id: string;
  filename: string;
  status: 'completed';
  result: {
    success: boolean;
    metrics?: ConversionMetrics;
    processing_time: number;
    output_file?: string;
  };
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ConversionParams {
  taux_douane: number;
  rapport_paiement?: string | null;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  defaultMode?: 'sync' | 'async';
}
