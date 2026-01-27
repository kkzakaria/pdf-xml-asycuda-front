'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useApiConfig } from '@/hooks/useApiConfig';
import { UserNav } from '@/components/auth/UserNav';

export default function SettingsPage() {
  const { config, defaultConfig, defaultMode, isConfigured, isLoading, updateConfig, updateDefaultMode, clearConfig } = useApiConfig();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedMode, setSelectedMode] = useState<'sync' | 'async'>('async');
  const [isSaved, setIsSaved] = useState(false);
  const [isModeSaved, setIsModeSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDefaultConfig = Boolean(defaultConfig.baseUrl && defaultConfig.apiKey);

  useEffect(() => {
    if (!isLoading) {
      setBaseUrl(config.baseUrl);
      setApiKey(config.apiKey);
      setSelectedMode(defaultMode);
    }
  }, [config, defaultMode, isLoading]);

  const handleSave = useCallback(() => {
    setError(null);

    if (!baseUrl.trim()) {
      setError('L\'URL de l\'API est requise');
      return;
    }

    if (!apiKey.trim()) {
      setError('La clé API est requise');
      return;
    }

    try {
      new URL(baseUrl);
    } catch {
      setError('Veuillez entrer une URL valide');
      return;
    }

    updateConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      defaultMode: selectedMode,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }, [baseUrl, apiKey, selectedMode, updateConfig]);

  const handleModeChange = useCallback((mode: 'sync' | 'async') => {
    setSelectedMode(mode);
    updateDefaultMode(mode);
    setIsModeSaved(true);
    setTimeout(() => setIsModeSaved(false), 3000);
  }, [updateDefaultMode]);

  const handleClear = useCallback(() => {
    clearConfig();
    setBaseUrl('');
    setApiKey('');
    setError(null);
  }, [clearConfig]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour au convertisseur
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Configuration API
          </h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            Configurez la connexion à l&apos;API de conversion PDF vers XML
          </p>

          {isSaved && (
            <Alert variant="success" className="mb-6">
              Configuration enregistrée avec succès !
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Paramètres de connexion</CardTitle>
              <CardDescription>
                Entrez l&apos;URL de l&apos;API et votre clé d&apos;authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input
                label="URL de l'API"
                name="baseUrl"
                type="url"
                placeholder="https://api.example.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                helpText="L'URL de base de votre serveur API de conversion"
              />
              <Input
                label="Clé API"
                name="apiKey"
                type="password"
                placeholder="Entrez votre clé API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                helpText="Votre clé d'authentification pour l'API"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={!isConfigured}
              >
                Effacer
              </Button>
              <Button onClick={handleSave}>
                Enregistrer
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Préférences de conversion</CardTitle>
              <CardDescription>
                Choisissez le mode de conversion par défaut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isModeSaved && (
                <Alert variant="success" className="mb-4">
                  Préférence de mode enregistrée !
                </Alert>
              )}
              <div className="flex flex-col gap-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    selectedMode === 'sync'
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="defaultMode"
                    value="sync"
                    checked={selectedMode === 'sync'}
                    onChange={() => handleModeChange('sync')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      Synchrone
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Attendre la fin de la conversion avant de recevoir le résultat
                    </span>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    selectedMode === 'async'
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="defaultMode"
                    value="async"
                    checked={selectedMode === 'async'}
                    onChange={() => handleModeChange('async')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      Asynchrone
                      <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Recommandé
                      </span>
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Traitement en arrière-plan avec suivi de progression
                    </span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Statut actuel
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isConfigured ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {isConfigured
                  ? 'API configurée et prête'
                  : 'Configuration API requise'}
              </span>
            </div>
            {isConfigured && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Connecté à : {config.baseUrl}
              </p>
            )}
            {hasDefaultConfig && !isConfigured && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                API par défaut disponible : {defaultConfig.baseUrl}
              </p>
            )}
          </div>

          {hasDefaultConfig && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h3 className="mb-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                API de production
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Une API par défaut est configurée pour ce déploiement. Vous pouvez utiliser
                le convertisseur directement sans configuration supplémentaire, ou personnaliser les paramètres ci-dessus.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
