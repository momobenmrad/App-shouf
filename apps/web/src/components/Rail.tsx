import type { ReactNode } from 'react';

export function Rail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="rail flex gap-3 overflow-x-auto pb-2">{children}</div>
    </section>
  );
}
