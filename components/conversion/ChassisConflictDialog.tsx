'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isForcing) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel, isForcing]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chassis-dialog-title"
    >
      {/* Backdrop cliquable */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={isForcing ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Boite du dialog */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '32rem',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          border: '1px solid #e4e4e7',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid #e4e4e7' }}>
          <div style={{ flexShrink: 0, width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="chassis-dialog-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#18181b' }}>
              Châssis déjà enregistré
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#71717a' }}>
              {conflict.detail}
            </p>
          </div>
          {!isForcing && (
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.25rem', borderRadius: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#a1a1aa' }}
              aria-label="Fermer"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Liste des doublons */}
        <div style={{ padding: '1.5rem', maxHeight: '16rem', overflowY: 'auto' }}>
          {conflict.duplicates.length === 0 ? (
            <div style={{ border: '1px solid #fcd34d', borderRadius: '0.5rem', backgroundColor: '#fffbeb', padding: '1rem', fontSize: '0.875rem', color: '#b45309' }}>
              Un ou plusieurs châssis de ce fichier ont déjà été traités. Forcez le retraitement pour les écraser.
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#3f3f46' }}>
                {conflict.duplicates.length === 1 ? '1 doublon détecté' : `${conflict.duplicates.length} doublons détectés`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conflict.duplicates.map((entry) => (
                  <div
                    key={entry.chassis_number}
                    style={{ border: '1px solid #fcd34d', borderRadius: '0.5rem', backgroundColor: '#fffbeb', padding: '1rem' }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingBottom: '0.375rem', paddingRight: '0.75rem', color: '#b45309', whiteSpace: 'nowrap' }}>Châssis</td>
                          <td style={{ paddingBottom: '0.375rem', fontFamily: 'monospace', fontWeight: 700, color: '#18181b', wordBreak: 'break-all' }}>{entry.chassis_number}</td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '0.375rem', paddingRight: '0.75rem', color: '#b45309', whiteSpace: 'nowrap' }}>Fichier source</td>
                          <td style={{ paddingBottom: '0.375rem', color: '#3f3f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '16rem' }}>{entry.first_filename}</td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '0.375rem', paddingRight: '0.75rem', color: '#b45309', whiteSpace: 'nowrap' }}>Première détection</td>
                          <td style={{ paddingBottom: '0.375rem', color: '#3f3f46' }}>{new Date(entry.first_seen_date).toLocaleString('fr-FR')}</td>
                        </tr>
                        {entry.first_rfcv_number && (
                          <tr>
                            <td style={{ paddingRight: '0.75rem', color: '#b45309', whiteSpace: 'nowrap' }}>N° RFCV</td>
                            <td style={{ fontFamily: 'monospace', color: '#3f3f46' }}>{entry.first_rfcv_number}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1.5rem', borderTop: '1px solid #e4e4e7' }}>
          <Button variant="outline" onClick={onCancel} disabled={isForcing}>
            Annuler
          </Button>
          <Button
            onClick={onForce}
            isLoading={isForcing}
            style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}
          >
            {isForcing ? 'Retraitement en cours...' : 'Forcer le retraitement'}
          </Button>
        </div>
      </div>
    </div>
  );
}
