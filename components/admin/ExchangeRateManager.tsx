'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuceCurrency } from '@/types/guce';

interface RateEntry {
  id: string;
  currency: string;
  rate: number;
  source: string;
  thursdayDate: string;
  fetchedAt: string;
  setBy: string | null;
}

interface AdminRatesData {
  rates: RateEntry[];
  currentThursdayDate: string;
}

export function ExchangeRateManager() {
  const [data, setData] = useState<AdminRatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usdRate, setUsdRate] = useState('');
  const [eurRate, setEurRate] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminRates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rates');
      const json = await res.json();
      if (json.success) setData(json);
      else setMessage({ text: json.error || 'Erreur de chargement des taux', type: 'error' });
    } catch {
      setMessage({ text: 'Erreur lors du chargement des taux', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminRates();
  }, [fetchAdminRates]);

  const handleSave = async (currency: GuceCurrency, rateStr: string) => {
    const rate = parseFloat(rateStr.replace(',', '.'));
    if (isNaN(rate) || rate <= 0) {
      setMessage({ text: 'Taux invalide', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, rate }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ text: `Taux ${currency} sauvegardé (${rate} XOF)`, type: 'success' });
        await fetchAdminRates();
      } else {
        setMessage({ text: json.error || 'Erreur', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Erreur réseau', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/guce/rates?refresh=true');
      const json = await res.json();
      if (json.success) {
        setMessage({ text: 'Taux GUCE mis à jour avec succès', type: 'success' });
        await fetchAdminRates();
      } else {
        setMessage({ text: json.error || 'Échec de la mise à jour GUCE', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Erreur réseau', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const sourceLabel = (source: string) =>
    source === 'guce'
      ? { text: 'GUCE', className: 'bg-green-100 text-green-700' }
      : { text: 'Manuel admin', className: 'bg-orange-100 text-orange-700' };

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement des taux...</div>;
  }

  const currentRates =
    data?.rates.filter((r) => r.thursdayDate === data.currentThursdayDate) ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Taux de change GUCE</h2>
          <p className="text-sm text-gray-500">
            Jeudi de référence : {data?.currentThursdayDate ?? '—'}
          </p>
        </div>
        <button
          onClick={handleForceRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRefreshing ? 'Mise à jour...' : 'Forcer la mise à jour GUCE'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {currentRates.length > 0 ? (
        <div className="mb-6 border rounded-lg overflow-hidden divide-y">
          {currentRates.map((entry) => {
            const label = sourceLabel(entry.source);
            return (
              <div key={entry.id} className="flex justify-between items-center px-4 py-3 bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{entry.currency}</span>
                  <span className="ml-2 text-gray-600">{entry.rate} XOF</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${label.className}`}>
                    {label.text}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.fetchedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-6 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Aucun taux pour le jeudi de référence courant. Forcer la mise à jour ou saisir manuellement.
        </p>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Saisie manuelle</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['USD', 'EUR'] as GuceCurrency[]).map((currency) => {
          const val = currency === 'USD' ? usdRate : eurRate;
          const setVal = currency === 'USD' ? setUsdRate : setEurRate;
          return (
            <div key={currency} className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">XOF/{currency}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={currency === 'USD' ? 'ex: 655.96' : 'ex: 720.00'}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleSave(currency, val)}
                  disabled={isSaving || !val}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
