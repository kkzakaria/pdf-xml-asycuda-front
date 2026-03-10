'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import type { ChassisConflictData } from '@/types/api';

interface ChassisConflictDialogProps {
  conflict: ChassisConflictData;
  isForcing: boolean;
  onForce: () => void;
  onCancel: () => void;
}

export function ChassisConflictDialog({
  conflict,
  isForcing,
  onForce,
  onCancel,
}: ChassisConflictDialogProps) {
  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chassis-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400"
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
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="chassis-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Châssis déjà enregistré
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {conflict.detail}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fermer"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liste des doublons */}
        <div className="max-h-64 overflow-y-auto p-6">
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {conflict.duplicates.length === 1
              ? '1 doublon détecté'
              : `${conflict.duplicates.length} doublons détectés`}
          </p>
          <div className="flex flex-col gap-3">
            {conflict.duplicates.map((entry) => (
              <div
                key={entry.chassis_number}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
              >
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <span className="text-amber-600 dark:text-amber-400">Châssis</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 break-all">
                    {entry.chassis_number}
                  </span>

                  <span className="text-amber-600 dark:text-amber-400">Fichier source</span>
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {entry.first_filename}
                  </span>

                  <span className="text-amber-600 dark:text-amber-400">Première détection</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {new Date(entry.first_seen_date).toLocaleString('fr-FR')}
                  </span>

                  {entry.first_rfcv_number && (
                    <>
                      <span className="text-amber-600 dark:text-amber-400">N° RFCV</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {entry.first_rfcv_number}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 p-6 dark:border-zinc-700 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isForcing}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onForce}
            isLoading={isForcing}
            className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
          >
            {isForcing ? 'Retraitement en cours...' : 'Forcer le retraitement'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
