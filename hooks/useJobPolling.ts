'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JobStatus } from '@/types/api';
import type { JobPollingState } from '@/types/conversion';
import { apiClient } from '@/lib/api/client';

interface UseJobPollingOptions {
  interval?: number;
  maxAttempts?: number;
  onComplete?: (jobId: string) => void;
  onError?: (error: string) => void;
}

interface UseJobPollingReturn extends JobPollingState {
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
}

export function useJobPolling(options: UseJobPollingOptions = {}): UseJobPollingReturn {
  const {
    interval = 2000,
    maxAttempts = 60,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<JobPollingState>({
    isPolling: false,
    jobStatus: null,
    error: null,
  });

  const attemptCountRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    jobIdRef.current = null;
    attemptCountRef.current = 0;
    setState((prev) => ({ ...prev, isPolling: false }));
  }, []);

  const poll = useCallback(async () => {
    if (!jobIdRef.current) return;

    attemptCountRef.current += 1;

    if (attemptCountRef.current > maxAttempts) {
      const errorMsg = 'Délai d\'attente dépassé';
      setState((prev) => ({ ...prev, error: errorMsg, isPolling: false }));
      onError?.(errorMsg);
      stopPolling();
      return;
    }

    try {
      const status = await apiClient.getJobStatus(jobIdRef.current);
      setState((prev) => ({ ...prev, jobStatus: status }));

      if (status.status === 'completed') {
        stopPolling();
        onComplete?.(jobIdRef.current);
      } else if (status.status === 'failed') {
        const errorMsg = status.error || 'Échec du traitement';
        setState((prev) => ({ ...prev, error: errorMsg, isPolling: false }));
        onError?.(errorMsg);
        stopPolling();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de connexion';
      setState((prev) => ({ ...prev, error: errorMsg, isPolling: false }));
      onError?.(errorMsg);
      stopPolling();
    }
  }, [maxAttempts, onComplete, onError, stopPolling]);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();

      jobIdRef.current = jobId;
      attemptCountRef.current = 0;
      setState({
        isPolling: true,
        jobStatus: {
          job_id: jobId,
          status: 'pending',
          filename: '',
          message: 'En attente...',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      poll();
      intervalIdRef.current = setInterval(poll, interval);
    },
    [interval, poll, stopPolling]
  );

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startPolling,
    stopPolling,
  };
}
