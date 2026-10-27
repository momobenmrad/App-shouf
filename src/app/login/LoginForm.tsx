"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Brand } from "@/lib/admin";
import { useLang } from "@/components/LangProvider";
import TopBar from "@/components/TopBar";

export default function LoginForm({ brand, role }: { brand: Brand; role: "rider" | "driver" }) {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+216 ");
  const [car, setCar] = useState({ model: "", color: "", plate: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, role, car: role === "driver" ? car : undefined }),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error ?? "Erreur");
    router.push(role === "driver" ? "/driver" : "/rider");
  }

  return (
    <>
      <TopBar brand={brand} />
      <main className="page" style={{ maxWidth: 440 }}>
        <form className="card stack" onSubmit={submit}>
          <h2 style={{ margin: 0 }}>{role === "driver" ? `🚕 ${t("driver")}` : `🙋 ${t("rider")}`}</h2>
          <label className="field">
            <span>{t("name")}</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
          <label className="field">
            <span>{t("phone")}</span>
            <input className="input" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          {role === "driver" && (
            <>
              <label className="field">
                <span>{t("carModel")}</span>
                <input className="input" placeholder="Kia Picanto" value={car.model} onChange={(e) => setCar({ ...car, model: e.target.value })} required />
              </label>
              <div className="row">
                <label className="field grow">
                  <span>{t("carColor")}</span>
                  <input className="input" placeholder="صفراء" value={car.color} onChange={(e) => setCar({ ...car, color: e.target.value })} required />
                </label>
                <label className="field grow">
                  <span>{t("plate")}</span>
                  <input className="input" placeholder="215 تونس 4821" value={car.plate} onChange={(e) => setCar({ ...car, plate: e.target.value })} required />
                </label>
              </div>
            </>
          )}
          {err && <p className="error">{err}</p>}
          <button className="btn block" disabled={busy}>{t("continue")}</button>
        </form>
      </main>
    </>
  );
}
