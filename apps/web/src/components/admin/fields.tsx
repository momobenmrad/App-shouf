import type { ReactNode } from 'react';

export const inputCls = 'w-full rounded-md border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-brand';

export function L({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/** ar / fr / en inputs for a translated field. */
export function I18nInputs({ name, label, values, multiline = false }: { name: string; label: string; values?: Partial<Record<'ar' | 'fr' | 'en', string>>; multiline?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(['fr', 'ar', 'en'] as const).map((l) => (
        <L key={l} label={`${label} (${l})`}>
          {multiline ? (
            <textarea name={`${name}_${l}`} defaultValue={values?.[l] ?? ''} rows={4} dir={l === 'ar' ? 'rtl' : 'ltr'} className={inputCls} />
          ) : (
            <input name={`${name}_${l}`} defaultValue={values?.[l] ?? ''} dir={l === 'ar' ? 'rtl' : 'ltr'} className={inputCls} />
          )}
        </L>
      ))}
    </div>
  );
}
