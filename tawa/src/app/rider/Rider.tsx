"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Brand } from "@/lib/admin";
import type { LatLng } from "@/lib/geo";
import type { FareBreakdown } from "@/lib/pricing";
import type { PaymentMethod, RideView } from "@/lib/rides";
import { useLang } from "@/components/LangProvider";
import TopBar from "@/components/TopBar";
import type { Marker } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Place = LatLng & { label: string };
type Quote = {
  city: string; distanceM: number; durationS: number; traffic: "fluide" | "moyen" | "dense";
  routeSource: "osrm" | "estimate"; route: LatLng[]; fare: FareBreakdown;
};

const DEFAULT_PICKUP: Place = { lat: 36.8003, lng: 10.1857, label: "شارع الحبيب بورقيبة، تونس" };
const SUGGESTIONS = ["حذا مونوبري المنار", "المطار", "9odem el bardo", "سيدي بوسعيد", "Tunisia Mall", "près de l'hôpital Charles Nicolle"];
const DETOUR_M = 250;

async function post<T>(url: string, data: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, data: body as T } : { ok: false, error: (body as { error?: string }).error ?? `HTTP ${res.status}` };
}

export default function Rider({ brand, name, initialRideId }: { brand: Brand; name: string; initialRideId: number | null }) {
  const { lang, t } = useLang();
  const [pickup, setPickup] = useState<Place>(DEFAULT_PICKUP);
  const [pickupText, setPickupText] = useState("");
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [dropoffText, setDropoffText] = useState("");
  const [understood, setUnderstood] = useState("");
  const [focus, setFocus] = useState<"pickup" | "dropoff">("dropoff");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [rideId, setRideId] = useState<number | null>(initialRideId);
  const [ride, setRide] = useState<RideView | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fitKey, setFitKey] = useState("init");

  // Start from the phone's position when it is in Tunisia.
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (pos.lat > 30 && pos.lat < 37.6 && pos.lng > 7.5 && pos.lng < 11.7) {
          setPickup({ ...pos, label: t("myPosition") });
          setFitKey("gps");
        }
      },
      () => {},
      { timeout: 5000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fresh quote whenever both ends are known.
  useEffect(() => {
    if (!dropoff || rideId) return;
    let stale = false;
    setQuote(null);
    post<Quote>("/api/quote", { pickup, dropoff }).then((r) => {
      if (stale) return;
      if (r.ok) {
        setQuote(r.data);
        setFitKey(`q${Date.now()}`);
      } else setErr(r.error);
    });
    return () => {
      stale = true;
    };
  }, [pickup, dropoff, rideId]);

  // Live ride state.
  useEffect(() => {
    if (!rideId) return;
    let alive = true;
    const tick = async () => {
      const res = await fetch(`/api/rides/${rideId}`, { cache: "no-store" });
      if (!alive) return;
      if (res.ok) setRide(await res.json());
      else if (res.status === 404) setRideId(null);
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [rideId]);

  useEffect(() => {
    if (ride) setFitKey(`ride-${ride.id}-${ride.status}`);
  }, [ride?.id, ride?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function search(which: "pickup" | "dropoff", text: string) {
    if (text.trim().length < 2) return;
    setBusy(true);
    setErr("");
    const r = await post<{ pos: LatLng; label: string; understood: string }>("/api/geocode", { text, near: { lat: pickup.lat, lng: pickup.lng } });
    setBusy(false);
    if (!r.ok) return setErr(t("notFound"));
    const place = { ...r.data.pos, label: r.data.label };
    if (which === "pickup") setPickup(place);
    else {
      setDropoff(place);
      setUnderstood(`«${text}» → ${r.data.understood}`);
    }
  }

  function pickOnMap(pos: LatLng) {
    if (rideId) return;
    const place = { ...pos, label: t("pointOnMap") };
    if (focus === "pickup") {
      setPickup(place);
      setPickupText("");
    } else {
      setDropoff(place);
      setDropoffText("");
      setUnderstood("");
    }
  }

  async function order() {
    if (!dropoff) return;
    setBusy(true);
    const r = await post<{ id: number }>("/api/rides", {
      pickup: { lat: pickup.lat, lng: pickup.lng },
      dropoff: { lat: dropoff.lat, lng: dropoff.lng },
      pickupLabel: pickup.label,
      dropoffLabel: dropoff.label,
      paymentMethod: payment,
    });
    setBusy(false);
    if (r.ok) setRideId(r.data.id);
    else setErr(r.error);
  }

  async function act(action: "cancel" | "rate", rating?: number) {
    if (!rideId) return;
    const r = await post<RideView>(`/api/rides/${rideId}`, { action, rating });
    if (r.ok) setRide(r.data);
    else setErr(r.error);
  }

  function reset() {
    setRideId(null);
    setRide(null);
    setDropoff(null);
    setDropoffText("");
    setUnderstood("");
    setQuote(null);
    setFitKey(`reset${Date.now()}`);
  }

  const markers: Marker[] = [];
  let route: LatLng[] = [];
  if (ride) {
    markers.push({ pos: ride.pickup, kind: "pickup" }, { pos: ride.dropoff, kind: "dropoff" });
    if (ride.driver?.pos && ride.status !== "completed" && ride.status !== "cancelled") markers.push({ pos: ride.driver.pos, kind: "car" });
    route = ride.route;
  } else {
    markers.push({ pos: pickup, kind: "pickup" });
    if (dropoff) markers.push({ pos: dropoff, kind: "dropoff" });
    route = quote?.route ?? [];
  }
  const offRoute = ride?.offRouteM != null && ride.offRouteM > DETOUR_M;
  const km = (m: number) => (m / 1000).toFixed(1);
  const mins = (s: number) => Math.max(1, Math.round(s / 60));

  return (
    <>
      <TopBar brand={brand} showLogout />
      <div className="app">
        <aside className="panel stack">
          <p className="eyebrow" style={{ margin: "4px 4px 0" }}>{name}</p>

          {!ride && (
            <div className="card stack">
              <label className="field">
                <span>{t("from")}</span>
                <form className="row" onSubmit={(e) => { e.preventDefault(); search("pickup", pickupText); }}>
                  <input className="input grow" placeholder={pickup.label} value={pickupText} onFocus={() => setFocus("pickup")} onChange={(e) => setPickupText(e.target.value)} />
                </form>
              </label>
              <label className="field">
                <span>{t("to")}</span>
                <form className="row" onSubmit={(e) => { e.preventDefault(); search("dropoff", dropoffText); }}>
                  <input className="input grow" autoFocus placeholder="حذا مونوبري المنار / 9odem el bardo" value={dropoffText} onFocus={() => setFocus("dropoff")} onChange={(e) => setDropoffText(e.target.value)} />
                  <button className="btn" disabled={busy}>{busy ? "…" : t("search")}</button>
                </form>
              </label>
              <div className="chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => { setDropoffText(s); setFocus("dropoff"); search("dropoff", s); }}>{s}</button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t("tapMapHint")}</p>
              {understood && dropoff && (
                <div className="understood"><span className="eyebrow">{t("understood")} · IA</span><div style={{ marginTop: 4 }}>{understood}</div><div className="muted" style={{ fontSize: 13 }}>{dropoff.label}</div></div>
              )}
              {err && <p className="error">{err}</p>}
            </div>
          )}

          {!ride && quote && (
            <div className="card stack">
              <div className="stats">
                <div className="stat"><b>{km(quote.distanceM)}</b><small>{t("km")}</small></div>
                <div className="stat"><b>{mins(quote.durationS)}</b><small>{t("min")}</small></div>
                <div className="stat"><b>{t(`trafficLevel_${quote.traffic}`)}</b><small>{t("traffic")}</small></div>
              </div>
              <div className="price">
                <span className="muted">{t("priceBefore")} {quote.fare.night && <span className="badge warn">{t("night")}</span>}</span>
                <b>{quote.fare.total.toFixed(3)}<small>DT</small></b>
              </div>
              {quote.routeSource === "estimate" && <p className="muted" style={{ fontSize: 12, margin: 0 }}>{t("estimated")}</p>}
              <div>
                <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{t("payWith")}</span>
                <div className="pay-options">
                  {(["cash", "konnect", "flouci", "d17"] as PaymentMethod[]).map((m) => (
                    <button key={m} className={`pay-option ${payment === m ? "on" : ""}`} onClick={() => setPayment(m)}>{t(`pay_${m}`)}</button>
                  ))}
                </div>
                {payment !== "cash" && <p className="muted" style={{ fontSize: 12 }}>{t("payOnlineSoon")}</p>}
              </div>
              <button className="btn block" onClick={order} disabled={busy}>{t("order")} · <span className="num">{quote.fare.total.toFixed(3)} DT</span></button>
            </div>
          )}

          {ride && (
            <div className="card stack">
              <div className="status-line">
                {["requested", "accepted", "in_progress"].includes(ride.status) && <span className="spinner" />}
                {t(`status_${ride.status}`)}
              </div>
              <div className="route-line"><div><i style={{ background: "var(--ink)" }} /><span>{ride.pickup.label}</span></div><div><i style={{ background: "var(--primary)" }} /><span>{ride.dropoff.label}</span></div></div>
              <div className="stats">
                <div className="stat"><b>{km(ride.distanceM)}</b><small>{t("km")}</small></div>
                <div className="stat"><b>{mins(ride.durationS)}</b><small>{t("min")}</small></div>
                <div className="stat"><b>{ride.fare.toFixed(3)}</b><small>DT · {t(`pay_${ride.paymentMethod}`)}</small></div>
              </div>

              {ride.driver && ride.status !== "cancelled" && (
                <div className="driver-card">
                  <div className="avatar">{ride.driver.name.charAt(0)}</div>
                  <div className="grow">
                    <b>{ride.driver.name}</b> <span style={{ color: "var(--accent)" }}>★</span> {ride.driver.rating.toFixed(1)}
                    <div className="muted" style={{ fontSize: 13 }}>{ride.driver.car} · {ride.driver.color}</div>
                    <span className="plate">{ride.driver.plate}</span>
                  </div>
                  <a className="btn accent small" href={`tel:${ride.driver.phone}`}>📞 {t("call")}</a>
                </div>
              )}

              {offRoute && (
                <div className="alert">⚠️ {t("detourAlert")}<br /><span className="muted" style={{ fontWeight: 600, fontSize: 13 }}>{t("detourSub")}</span></div>
              )}
              {!offRoute && ride.detourM > 0 && ride.status === "in_progress" && <span className="badge warn">{t("backToRoute")}</span>}

              {["requested", "accepted", "arrived"].includes(ride.status) && (
                <button className="btn ghost" onClick={() => act("cancel")}>{t("cancel")}</button>
              )}

              {ride.status === "completed" && (
                <div className="stack" style={{ textAlign: "center" }}>
                  <div className="price"><span>{t("total")}</span><b>{ride.fare.toFixed(3)}<small>DT</small></b></div>
                  {ride.detourM > 0 && <span className="badge warn">{t("detourRecorded")} ({ride.detourM} m)</span>}
                  {ride.rating ? (
                    <p>{t("thanks")} {"★".repeat(ride.rating)}</p>
                  ) : (
                    <>
                      <span className="muted">{t("rate")}</span>
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} className="on" onClick={() => act("rate", n)} aria-label={`${n}`}>★</button>
                        ))}
                      </div>
                    </>
                  )}
                  <button className="btn block secondary" onClick={reset}>{t("newRide")}</button>
                </div>
              )}
              {ride.status === "cancelled" && <button className="btn block secondary" onClick={reset}>{t("newRide")}</button>}
              {err && <p className="error">{err}</p>}
            </div>
          )}
          <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>{lang === "ar" ? brand.slogan : brand.name}</p>
        </aside>
        <div className="map-wrap">
          <MapView center={pickup} markers={markers} route={route} alert={offRoute} onPick={pickOnMap} fitKey={fitKey} />
        </div>
      </div>
    </>
  );
}
