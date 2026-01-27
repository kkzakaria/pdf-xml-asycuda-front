'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiConfig } from '@/types/api';
import { getApiConfig, saveApiConfig, isApiConfigured, getDefaultConfig, getDefaultMode } from '@/lib/api/client';

interface UseApiConfigReturn {
  config: ApiConfig;
  defaultConfig: ApiConfig;
  defaultMode: 'sync' | 'async';
  isConfigured: boolean;
  isLoading: boolean;
  updateConfig: (config: ApiConfig) => void;
  updateDefaultMode: (mode: 'sync' | 'async') => void;
  clearConfig: () => void;
}

export function useApiConfig(): UseApiConfigReturn {
  const [config, setConfig] = useState<ApiConfig>({ baseUrl: '', apiKey: '', defaultMode: 'async' });
  const [defaultConfig, setDefaultConfig] = useState<ApiConfig>({ baseUrl: '', apiKey: '', defaultMode: 'async' });
  const [defaultMode, setDefaultMode] = useState<'sync' | 'async'>('async');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedConfig = getApiConfig();
    const defaults = getDefaultConfig();
    setConfig(storedConfig);
    setDefaultConfig(defaults);
    setDefaultMode(getDefaultMode());
    setIsConfigured(isApiConfigured());
    setIsLoading(false);
  }, []);

  const updateConfig = useCallback((newConfig: ApiConfig) => {
    saveApiConfig(newConfig);
    setConfig(newConfig);
    setIsConfigured(Boolean(newConfig.baseUrl && newConfig.apiKey));
    if (newConfig.defaultMode) {
      setDefaultMode(newConfig.defaultMode);
    }
  }, []);

  const updateDefaultMode = useCallback((mode: 'sync' | 'async') => {
    const currentConfig = getApiConfig();
    const newConfig = { ...currentConfig, defaultMode: mode };
    saveApiConfig(newConfig);
    setConfig(newConfig);
    setDefaultMode(mode);
  }, []);

  const clearConfig = useCallback(() => {
    const defaults = getDefaultConfig();
    saveApiConfig({ baseUrl: '', apiKey: '', defaultMode: defaults.defaultMode });
    setConfig(defaults);
    setDefaultMode(defaults.defaultMode || 'async');
    setIsConfigured(Boolean(defaults.baseUrl && defaults.apiKey));
  }, []);

  return {
    config,
    defaultConfig,
    defaultMode,
    isConfigured,
    isLoading,
    updateConfig,
    updateDefaultMode,
    clearConfig,
  };
}
