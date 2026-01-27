import type { ConversionMetrics } from '@/types/api';
import { Badge } from '@/components/ui/Badge';

interface MetricsDisplayProps {
  metrics: ConversionMetrics;
}

interface MetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
}

function MetricItem({ label, value, unit }: MetricItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Métriques de conversion
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricItem label="Articles" value={metrics.items_count ?? 0} />
        <MetricItem label="Conteneurs" value={metrics.containers_count ?? 0} />
        <MetricItem
          label="Taux de remplissage"
          value={(metrics.fill_rate ?? 0).toFixed(1)}
          unit="%"
        />
        <MetricItem
          label="Temps de traitement"
          value={(metrics.processing_time ?? 0).toFixed(2)}
          unit="s"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={metrics.xml_valid ? 'success' : 'error'}>
          {metrics.xml_valid ? 'XML valide' : 'XML invalide'}
        </Badge>
        <Badge variant={metrics.has_exporter ? 'success' : 'warning'}>
          {metrics.has_exporter ? 'Exportateur' : 'Sans exportateur'}
        </Badge>
        <Badge variant={metrics.has_consignee ? 'success' : 'warning'}>
          {metrics.has_consignee ? 'Destinataire' : 'Sans destinataire'}
        </Badge>
        {metrics.warnings_count > 0 && (
          <Badge variant="warning">
            {metrics.warnings_count} avertissement{metrics.warnings_count > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {metrics.warnings && metrics.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h4 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Avertissements
          </h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
            {metrics.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
