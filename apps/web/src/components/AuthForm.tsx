import type { ReactNode } from 'react';

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input {...props} className="w-full rounded-md border border-line bg-panel px-3 py-2 outline-none focus:border-brand" />
    </label>
  );
}

export function Submit({ children }: { children: ReactNode }) {
  return <button className="w-full rounded-md bg-brand py-2.5 font-semibold hover:bg-brand-dark">{children}</button>;
}
