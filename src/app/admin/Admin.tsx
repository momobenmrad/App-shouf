"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Brand } from "@/lib/admin";
import type { Tariff } from "@/lib/pricing";
import TopBar from "@/components/TopBar";

// The back-office is for the operator / buyer, so it is in French.
type Dashboard = {
  rides: number; completed: number; volume: number; commission: number; detours: number;
  driversOnline: number; driversTotal: number; byHour: number[];
  recent: { id: number; status: string; city: string; pickup_label: string; dropoff_label: string; fare: number; payment_method: string; detour_m: number; requested_at: string; rider: string; driver: string | null }[];
  drivers: { user_id: number; name: string; phone: string; car_model: string; plate: string; rating: number; online: boolean; simulated: boolean }[];
  tariffs: Tariff[];
};

const STATUS: Record<string, [string, string]> = {
  requested: ["En attente", ""],
  accepted: ["Acceptée", ""],
  arrived: ["Chauffeur arrivé", ""],
  in_progress: ["En cours", "warn"],
  completed: ["Terminée", "ok"],
  cancelled: ["Annulée", "red"],
};

const TARIFF_FIELDS: [keyof Tariff, string, number][] = [
  ["baseFare", "Prise en charge (DT)", 0.1],
  ["perKm", "DT / km", 0.01],
  ["perMinute", "DT / min", 0.01],
  ["minimumFare", "Minimum (DT)", 0.1],
  ["nightMultiplier", "× nuit", 0.1],
  ["nightStartHour", "Nuit de (h)", 1],
  ["nightEndHour", "à (h)", 1],
  ["commissionRate", "Commission (0–1)", 0.01],
];

async function put(url: string, data: unknown) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.ok ? null : ((await res.json()).error as string);
}

export default function Admin({ brand: initialBrand }: { brand: Brand }) {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [brand, setBrand] = useState<Brand>(initialBrand);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!alive || !r.ok) return;
      const d: Dashboard = await r.json();
      setData(d);
      setTariffs((cur) => (cur.length ? cur : d.tariffs));
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  async function saveTariff(t: Tariff) {
    const e = await put("/api/admin/tariffs", t);
    flash(e ? `Erreur : ${e}` : `Tarif ${t.city} enregistré`);
  }

  async function saveBrand() {
    const e = await put("/api/admin/brand", brand);
    if (e) return flash(`Erreur : ${e}`);
    flash("Marque enregistrée");
    router.refresh();
  }

  function addCity() {
    const city = prompt("Nom de la ville ?");
    if (!city) return;
    setTariffs([...tariffs, { ...tariffs[0], city }]);
  }

  const max = Math.max(1, ...(data?.byHour ?? [0]));

  return (
    <div dir="ltr" className="admin">
      <TopBar brand={initialBrand} showLogout />
      <main className="page admin-grid">
        {msg && <div className="card flash">{msg}</div>}

        <section className="kpis">
          <div className="card kpi"><small>Courses aujourd'hui</small><b>{data?.rides ?? "–"}</b></div>
          <div className="card kpi"><small>Terminées</small><b>{data?.completed ?? "–"}</b></div>
          <div className="card kpi hero-kpi"><small>Volume (DT)</small><b>{data ? data.volume.toFixed(3) : "–"}</b></div>
          <div className="card kpi"><small>Commission (DT)</small><b>{data ? data.commission.toFixed(3) : "–"}</b></div>
          <div className="card kpi"><small>Chauffeurs en ligne</small><b>{data ? `${data.driversOnline} / ${data.driversTotal}` : "–"}</b></div>
          <div className="card kpi"><small>Écarts d'itinéraire</small><b>{data?.detours ?? "–"}</b></div>
        </section>

        <section className="card">
          <div className="section-title">Courses par heure (24 h)</div>
          <div className="bars">
            {(data?.byHour ?? Array(24).fill(0)).map((n, h) => (
              <i key={h} title={`${h}h : ${n}`} style={{ height: `${(n / max) * 100}%` }} />
            ))}
          </div>
          <div className="row muted" style={{ justifyContent: "space-between", fontSize: 11 }}><span>0h</span><span>12h</span><span>23h</span></div>
        </section>

        <section className="card">
          <div className="section-title">Dernières courses</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Statut</th><th>Ville</th><th>Client</th><th>Chauffeur</th><th>Départ → Arrivée</th><th>Prix</th><th>Paiement</th><th>Écart</th></tr></thead>
              <tbody>
                {data?.recent.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><span className={`badge ${STATUS[r.status]?.[1] ?? ""}`}>{STATUS[r.status]?.[0] ?? r.status}</span></td>
                    <td>{r.city}</td>
                    <td>{r.rider}</td>
                    <td>{r.driver ?? "–"}</td>
                    <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>{r.pickup_label} → {r.dropoff_label}</td>
                    <td>{r.fare.toFixed(3)}</td>
                    <td>{r.payment_method}</td>
                    <td>{r.detour_m > 0 ? <span className="badge warn">{r.detour_m} m</span> : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="section-title">Tarifs par ville</div>
            <button className="btn ghost small" onClick={addCity}>+ Ville</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ville</th>{TARIFF_FIELDS.map(([, label]) => <th key={label}>{label}</th>)}<th /></tr></thead>
              <tbody>
                {tariffs.map((t, i) => (
                  <tr key={t.city}>
                    <td><b>{t.city}</b></td>
                    {TARIFF_FIELDS.map(([key, , step]) => (
                      <td key={key}>
                        <input
                          className="input"
                          type="number"
                          step={step}
                          value={t[key] as number}
                          onChange={(e) => setTariffs(tariffs.map((x, j) => (j === i ? { ...x, [key]: Number(e.target.value) } : x)))}
                        />
                      </td>
                    ))}
                    <td><button className="btn small" onClick={() => saveTariff(t)}>Enregistrer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="section-title">Marque blanche</div>
          <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
            <label className="field"><span>Nom</span><input className="input" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></label>
            <label className="field"><span>Nom (arabe)</span><input className="input" dir="rtl" value={brand.nameAr} onChange={(e) => setBrand({ ...brand, nameAr: e.target.value })} /></label>
            <label className="field grow"><span>Slogan</span><input className="input" dir="auto" value={brand.slogan} onChange={(e) => setBrand({ ...brand, slogan: e.target.value })} /></label>
            <label className="field"><span>Couleur principale</span><input className="input" type="color" style={{ width: 70, padding: 2, height: 44 }} value={brand.primary} onChange={(e) => setBrand({ ...brand, primary: e.target.value })} /></label>
            <label className="field"><span>Accent</span><input className="input" type="color" style={{ width: 70, padding: 2, height: 44 }} value={brand.accent} onChange={(e) => setBrand({ ...brand, accent: e.target.value })} /></label>
            <button className="btn" onClick={saveBrand}>Appliquer</button>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="mark" style={{ background: brand.primary }}>{brand.nameAr.charAt(0)}</span>
            <b style={{ fontSize: 22 }}>{brand.name} · {brand.nameAr}</b>
            <span className="btn small" style={{ background: brand.primary }}>Aperçu bouton</span><span className="badge" style={{ background: brand.accent, color: "#06131c" }}>Accent</span>
          </div>
        </section>

        <section className="card">
          <div className="section-title">Chauffeurs</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Téléphone</th><th>Voiture</th><th>Plaque</th><th>Note</th><th>Statut</th></tr></thead>
              <tbody>
                {data?.drivers.map((d) => (
                  <tr key={d.user_id}>
                    <td>{d.name} {d.simulated && <span className="badge">démo</span>}</td>
                    <td dir="ltr">{d.phone}</td>
                    <td>{d.car_model}</td>
                    <td>{d.plate}</td>
                    <td>★ {d.rating.toFixed(1)}</td>
                    <td><span className={`badge ${d.online ? "ok" : ""}`}>{d.online ? "En ligne" : "Hors ligne"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
