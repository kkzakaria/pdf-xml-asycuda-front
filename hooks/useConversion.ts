'use client';

import { useReducer, useCallback } from 'react';
import type { ConversionState, ConversionAction, ConversionMode } from '@/types/conversion';
import type { ConversionResult } from '@/types/api';
import { apiClient, ChassisConflictApiError } from '@/lib/api/client';

const initialState: ConversionState = {
  status: 'idle',
  mode: 'async',
  file: null,
  tauxDouane: 0,
  rapportPaiement: '',
  jobId: null,
  result: null,
  xmlBlob: null,
  error: null,
  progress: 0,
  chassisConflict: null,
};

function conversionReducer(
  state: ConversionState,
  action: ConversionAction
): ConversionState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload, error: null };
    case 'REMOVE_FILE':
      return { ...state, file: null };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_TAUX_DOUANE':
      return { ...state, tauxDouane: action.payload };
    case 'SET_RAPPORT_PAIEMENT':
      return { ...state, rapportPaiement: action.payload };
    case 'START_CONVERSION':
      return {
        ...state,
        status: 'converting',
        error: null,
        result: null,
        xmlBlob: null,
        progress: 0,
        // chassisConflict intentionnellement conservé pour garder le dialog ouvert pendant le forçage
      };
    case 'CHASSIS_CONFLICT':
      return {
        ...state,
        status: 'chassis_conflict',
        chassisConflict: action.payload,
        progress: 0,
      };
    case 'START_POLLING':
      return {
        ...state,
        status: 'polling',
        jobId: action.payload,
        progress: 10,
      };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    case 'CONVERSION_SUCCESS':
      return {
        ...state,
        status: 'completed',
        result: action.payload.result,
        xmlBlob: action.payload.xmlBlob,
        progress: 100,
        chassisConflict: null,
      };
    case 'CONVERSION_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        progress: 0,
      };
    case 'RESET':
      return { ...initialState, mode: state.mode };
    default:
      return state;
  }
}

interface UseConversionReturn {
  state: ConversionState;
  setFile: (file: File) => void;
  removeFile: () => void;
  setMode: (mode: ConversionMode) => void;
  setTauxDouane: (rate: number) => void;
  setRapportPaiement: (value: string) => void;
  startConversion: () => Promise<void>;
  forceReprocess: () => Promise<void>;
  reset: () => void;
  downloadResult: () => void;
}

export function useConversion(): UseConversionReturn {
  const [state, dispatch] = useReducer(conversionReducer, initialState);

  const setFile = useCallback((file: File) => {
    dispatch({ type: 'SET_FILE', payload: file });
  }, []);

  const removeFile = useCallback(() => {
    dispatch({ type: 'REMOVE_FILE' });
  }, []);

  const setMode = useCallback((mode: ConversionMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setTauxDouane = useCallback((rate: number) => {
    dispatch({ type: 'SET_TAUX_DOUANE', payload: rate });
  }, []);

  const setRapportPaiement = useCallback((value: string) => {
    dispatch({ type: 'SET_RAPPORT_PAIEMENT', payload: value });
  }, []);

  const downloadXmlImmediately = useCallback(async (jobId: string): Promise<Blob | null> => {
    try {
      const blob = await apiClient.downloadXml(jobId);
      return blob;
    } catch (error) {
      console.warn('Could not download XML immediately:', error);
      return null;
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string): Promise<{ result: ConversionResult; xmlBlob: Blob | null }> => {
    const maxAttempts = 90; // 3 minutes max pour les gros RFCV (200+ articles)
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await apiClient.getJobStatus(jobId);

      const progress = Math.min(10 + (attempt / maxAttempts) * 80, 90);
      dispatch({ type: 'UPDATE_PROGRESS', payload: progress });

      if (status.status === 'completed') {
        const [jobResult, xmlBlob] = await Promise.all([
          apiClient.getJobResult(jobId),
          downloadXmlImmediately(jobId),
        ]);

        return {
          result: {
            success: jobResult.result.success,
            job_id: jobResult.job_id,
            filename: jobResult.filename,
            output_file: jobResult.result.output_file,
            message: 'Conversion terminée',
            metrics: jobResult.result.metrics,
            processing_time: jobResult.result.processing_time,
          },
          xmlBlob,
        };
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Échec de la conversion');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Délai de conversion dépassé');
  }, [downloadXmlImmediately]);

  const runConversion = useCallback(async (forceReprocess = false) => {
    if (!state.file || state.tauxDouane <= 0) {
      dispatch({
        type: 'CONVERSION_ERROR',
        payload: 'Veuillez fournir un fichier PDF et un taux de change valide',
      });
      return;
    }

    dispatch({ type: 'START_CONVERSION' });

    try {
      if (state.mode === 'sync') {
        const result = await apiClient.convertSync(
          state.file,
          state.tauxDouane,
          state.rapportPaiement || null,
          forceReprocess
        );
        const xmlBlob = await downloadXmlImmediately(result.job_id);
        dispatch({ type: 'CONVERSION_SUCCESS', payload: { result, xmlBlob } });
      } else {
        const response = await apiClient.convertAsync(
          state.file,
          state.tauxDouane,
          state.rapportPaiement || null,
          forceReprocess
        );
        dispatch({ type: 'START_POLLING', payload: response.job_id });

        const { result, xmlBlob } = await pollJobStatus(response.job_id);
        dispatch({ type: 'CONVERSION_SUCCESS', payload: { result, xmlBlob } });
      }
    } catch (error) {
      if (error instanceof ChassisConflictApiError) {
        dispatch({ type: 'CHASSIS_CONFLICT', payload: error.data });
      } else {
        dispatch({
          type: 'CONVERSION_ERROR',
          payload: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
  }, [state.file, state.tauxDouane, state.rapportPaiement, state.mode, pollJobStatus, downloadXmlImmediately]);

  const startConversion = useCallback(() => runConversion(false), [runConversion]);

  const forceReprocess = useCallback(() => runConversion(true), [runConversion]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const generateFilename = useCallback(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `XML_${date}_${time}.xml`;
  }, []);

  const downloadResult = useCallback(() => {
    const filename = generateFilename();

    if (state.xmlBlob) {
      const url = URL.createObjectURL(state.xmlBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (state.result?.job_id) {
      // Fallback: try to download from API (might fail if file is gone)
      apiClient.downloadXml(state.result.job_id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error('Download failed:', error);
          alert('Le fichier n\'est plus disponible sur le serveur. Veuillez relancer la conversion.');
        });
    }
  }, [state.xmlBlob, state.result, generateFilename]);

  return {
    state,
    setFile,
    removeFile,
    setMode,
    setTauxDouane,
    setRapportPaiement,
    startConversion,
    forceReprocess,
    reset,
    downloadResult,
  };
}
