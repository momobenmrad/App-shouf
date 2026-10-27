"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Brand } from "@/lib/admin";
import { useLang } from "@/components/LangProvider";
import TopBar from "@/components/TopBar";

export default function AdminLogin({ brand }: { brand: Brand }) {
  const { t } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) return setErr((await res.json()).error ?? "Erreur");
    router.refresh();
  }

  return (
    <>
      <TopBar brand={brand} />
      <main className="page" style={{ maxWidth: 400 }}>
        <form className="card stack" onSubmit={submit}>
          <h2 style={{ margin: 0 }}>📊 {t("admin")}</h2>
          <label className="field">
            <span>{t("password")}</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn block">{t("continue")}</button>
        </form>
      </main>
    </>
  );
}
