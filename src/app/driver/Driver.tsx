"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Brand } from "@/lib/admin";
import type { LatLng } from "@/lib/geo";
import type { RideView } from "@/lib/rides";
import { useLang } from "@/components/LangProvider";
import TopBar from "@/components/TopBar";
import type { Marker } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Profile = { online: boolean; name: string; car: string; color: string; plate: string; rating: number };
type Offer = { id: number; pickup: LatLng & { label: string }; dropoff: LatLng & { label: string }; fare: number; earnings: number; distanceM: number; toPickupM: number };

const TUNIS: LatLng = { lat: 36.8065, lng: 10.1815 };

async function post<T>(url: string, data: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, data: body as T } : { ok: false, error: (body as { error?: string }).error ?? `HTTP ${res.status}` };
}

export default function Driver({ brand, initialRideId }: { brand: Brand; initialRideId: number | null }) {
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [gps, setGps] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [rideId, setRideId] = useState<number | null>(initialRideId);
  const [ride, setRide] = useState<RideView | null>(null);
  const [detour, setDetour] = useState(false);
  const [err, setErr] = useState("");
  const [fitKey, setFitKey] = useState("init");
  const posRef = useRef<LatLng | null>(null);

  useEffect(() => {
    fetch("/api/driver/online").then(async (r) => r.ok && setProfile(await r.json()));
  }, []);

  const sendPosition = useCallback(async (p: LatLng) => {
    posRef.current = p;
    setPos(p);
    const r = await post<{ detour: boolean }>("/api/driver/location", p);
    if (r.ok) setDetour(r.data.detour);
  }, []);

  // Real GPS when available; otherwise the driver taps the map (desktop demo).
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGps(true);
        sendPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setGps(false),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sendPosition]);

  // Heartbeat so the server keeps seeing us as available.
  useEffect(() => {
    const id = setInterval(() => posRef.current && sendPosition(posRef.current), 15000);
    return () => clearInterval(id);
  }, [sendPosition]);

  // Offers while online and free.
  useEffect(() => {
    if (!profile?.online || rideId) return setOffers([]);
    let alive = true;
    const tick = async () => {
      const r = await fetch("/api/driver/offers", { cache: "no-store" });
      if (alive && r.ok) setOffers((await r.json()).offers);
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [profile?.online, rideId, pos]);

  // Current ride.
  useEffect(() => {
    if (!rideId) return;
    let alive = true;
    const tick = async () => {
      const r = await fetch(`/api/rides/${rideId}`, { cache: "no-store" });
      if (!alive) return;
      if (r.ok) setRide(await r.json());
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [rideId]);

  useEffect(() => {
    if (ride) setFitKey(`${ride.id}-${ride.status}`);
  }, [ride?.id, ride?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleOnline() {
    if (!profile) return;
    const r = await post<{ online: boolean }>("/api/driver/online", { online: !profile.online });
    if (r.ok) setProfile({ ...profile, online: r.data.online });
  }

  async function act(id: number, action: "accept" | "arrive" | "start" | "complete" | "cancel") {
    setErr("");
    const r = await post<RideView>(`/api/rides/${id}`, { action });
    if (!r.ok) return setErr(r.error);
    if (action === "accept") setRideId(id);
    setRide(r.data);
  }

  function finish() {
    setRide(null);
    setRideId(null);
    setDetour(false);
  }

  const markers: Marker[] = [];
  if (pos) markers.push({ pos, kind: "car" });
  if (ride) markers.push({ pos: ride.pickup, kind: "pickup" }, { pos: ride.dropoff, kind: "dropoff" });
  else for (const o of offers) markers.push({ pos: o.pickup, kind: "pickup" });
  const km = (m: number) => (m / 1000).toFixed(1);

  return (
    <>
      <TopBar brand={brand} showLogout />
      <div className="app">
        <aside className="panel stack">
          {profile && (
            <div className="card stack">
              <div className="driver-card">
                <div className="avatar">{profile.name.charAt(0)}</div>
                <div className="grow">
                  <b>{profile.name}</b> <span style={{ color: "var(--accent)" }}>★</span> {profile.rating.toFixed(1)}
                  <div className="muted" style={{ fontSize: 13 }}>{profile.car} · {profile.color}</div>
                  <span className="plate">{profile.plate}</span>
                </div>
                <span className={`badge ${profile.online ? "ok" : ""}`}>{profile.online ? t("online") : t("offline")}</span>
              </div>
              {!ride && (
                <button className={`btn block ${profile.online ? "secondary" : ""}`} onClick={toggleOnline}>
                  {profile.online ? t("goOffline") : t("goOnline")}
                </button>
              )}
              {!gps && <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t("gpsHint")}</p>}
            </div>
          )}

          {!ride && profile?.online && (
            <div className="card stack">
              <div className="section-title">{t("offers")}</div>
              {offers.length === 0 && <p className="muted">{t("noOffers")}</p>}
              {offers.map((o) => (
                <div key={o.id} className="offer stack">
                  <div className="route-line"><div><i style={{ background: "var(--ink)" }} /><span>{o.pickup.label}</span></div><div><i style={{ background: "var(--primary)" }} /><span>{o.dropoff.label}</span></div></div>
                  <div className="row">
                    <span className="badge">{km(o.toPickupM)} {t("km")} {t("toPickup")}</span>
                    <span className="badge">{km(o.distanceM)} {t("km")}</span>
                    <span className="grow" />
                    <b>{t("youEarn")} <span className="num">{o.earnings.toFixed(3)} DT</span></b>
                  </div>
                  <button className="btn block" onClick={() => act(o.id, "accept")}>{t("accept")}</button>
                </div>
              ))}
            </div>
          )}

          {ride && (
            <div className="card stack">
              <div className="status-line">{t(`status_${ride.status}`)}</div>
              <div className="route-line"><div><i style={{ background: "var(--ink)" }} /><span>{ride.pickup.label}</span></div><div><i style={{ background: "var(--primary)" }} /><span>{ride.dropoff.label}</span></div></div>
              <div className="stats two">
                <div className="stat"><b>{km(ride.distanceM)}</b><small>{t("km")}</small></div>
                <div className="stat"><b>{ride.fare.toFixed(3)}</b><small>DT · {t(`pay_${ride.paymentMethod}`)}</small></div>
              </div>
              {detour && ride.status === "in_progress" && <div className="alert">⚠️ {t("detourAlert")}</div>}
              {ride.status === "accepted" && <button className="btn block" onClick={() => act(ride.id, "arrive")}>{t("arrivedBtn")}</button>}
              {ride.status === "arrived" && <button className="btn block" onClick={() => act(ride.id, "start")}>{t("startBtn")}</button>}
              {ride.status === "in_progress" && <button className="btn block" onClick={() => act(ride.id, "complete")}>{t("completeBtn")}</button>}
              {["accepted", "arrived"].includes(ride.status) && <button className="btn ghost" onClick={() => act(ride.id, "cancel")}>{t("cancel")}</button>}
              {ride.status === "completed" && (
                <>
                  <div className="price"><span>{ride.paymentMethod === "cash" ? t("collect") : t("total")}</span><b>{ride.fare.toFixed(3)}<small>DT</small></b></div>
                  <button className="btn block secondary" onClick={finish}>{t("continue")}</button>
                </>
              )}
              {ride.status === "cancelled" && <button className="btn block secondary" onClick={finish}>{t("continue")}</button>}
            </div>
          )}
          {err && <p className="error">{err}</p>}
        </aside>
        <div className="map-wrap">
          <MapView
            center={pos ?? TUNIS}
            markers={markers}
            route={ride?.route ?? []}
            alert={detour}
            onPick={gps ? undefined : sendPosition}
            fitKey={fitKey}
          />
        </div>
      </div>
    </>
  );
}
