"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

export type Marker = { pos: LatLng; kind: "pickup" | "dropoff" | "car" | "me" };

type Props = {
  center: LatLng;
  markers?: Marker[];
  route?: LatLng[];
  /** Highlights the route in orange (detour in progress). */
  alert?: boolean;
  onPick?: (pos: LatLng) => void;
  /** Change this value to re-fit the view on the route/markers. */
  fitKey?: string;
};

// OpenStreetMap tiles, darkened in CSS (.map-dark) to match the night theme; no API key needed.
// Point NEXT_PUBLIC_TILE_URL at a dedicated tile provider for production volumes.
const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const ICONS: Record<Marker["kind"], string> = {
  pickup: `<div class="pin pin-pickup"></div>`,
  dropoff: `<div class="pin pin-dropoff"></div>`,
  car: `<div class="pin-car"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1206" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/></svg></div>`,
  me: `<div class="pin pin-me"></div>`,
};

export default function MapView({ center, markers = [], route = [], alert = false, onPick, fitKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // Leaflet touches `window`, so it is loaded on the client only.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      const m = mod.map(el.current, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], 13);
      mod.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION, className: "map-dark" }).addTo(m);
      mod.control.zoom({ position: "bottomleft" }).addTo(m);
      m.on("click", (e: Leaflet.LeafletMouseEvent) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      layer.current = mod.layerGroup().addTo(m);
      map.current = m;
      draw();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const mod = L.current;
    const m = map.current;
    if (!mod || !m || !layer.current) return;
    layer.current.clearLayers();
    if (route.length > 1) {
      mod.polyline(route.map((p) => [p.lat, p.lng] as [number, number]), {
        color: alert ? "#ff9f43" : getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#f2b544",
        weight: 14,
        opacity: 0.18,
      }).addTo(layer.current);
      mod.polyline(route.map((p) => [p.lat, p.lng] as [number, number]), {
        color: alert ? "#ff9f43" : getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#f2b544",
        weight: 4,
        opacity: 1,
      }).addTo(layer.current);
    }
    for (const mk of markers) {
      mod.marker([mk.pos.lat, mk.pos.lng], {
        icon: mod.divIcon({ html: ICONS[mk.kind], className: "", iconSize: mk.kind === "car" ? [30, 30] : [28, 28], iconAnchor: mk.kind === "dropoff" ? [14, 28] : mk.kind === "car" ? [15, 15] : [14, 14] }),
        zIndexOffset: mk.kind === "car" ? 1000 : 0,
      }).addTo(layer.current);
    }
  }

  useEffect(draw);

  useEffect(() => {
    const mod = L.current;
    const m = map.current;
    if (!mod || !m) return;
    const pts = [...route, ...markers.map((x) => x.pos)];
    if (pts.length > 1) m.fitBounds(mod.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), { padding: [60, 60], maxZoom: 16 });
    else m.setView([center.lat, center.lng], 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return <div ref={el} className="map" />;
}
