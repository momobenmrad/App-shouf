import { query } from "./db";
import { distanceToPolyline, haversine, type LatLng } from "./geo";
import { nearestCity } from "./geocode";
import { computeFare, DEFAULT_TARIFFS, type FareBreakdown, type Tariff } from "./pricing";
import { getRoute, type Route } from "./routing";
import { ACCEPT_AFTER_S, simulate } from "./simulation";

export const DETOUR_THRESHOLD_M = 250;
const OFFER_RADIUS_M = 6000;
/** A real driver nearby gets this long to accept before a demo driver steps in. */
const REAL_DRIVER_PRIORITY_S = 20;

export type RideStatus = "requested" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "konnect" | "flouci" | "d17";
export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "konnect", "flouci", "d17"];

type TariffRow = {
  city: string; base_fare: string; per_km: string; per_minute: string; minimum_fare: string;
  night_multiplier: string; night_start_hour: number; night_end_hour: number; commission_rate: string;
};

const toTariff = (r: TariffRow): Tariff => ({
  city: r.city,
  baseFare: Number(r.base_fare),
  perKm: Number(r.per_km),
  perMinute: Number(r.per_minute),
  minimumFare: Number(r.minimum_fare),
  nightMultiplier: Number(r.night_multiplier),
  nightStartHour: r.night_start_hour,
  nightEndHour: r.night_end_hour,
  commissionRate: Number(r.commission_rate),
});

export async function listTariffs(): Promise<Tariff[]> {
  return (await query<TariffRow>("SELECT * FROM tariffs ORDER BY city")).map(toTariff);
}

export async function tariffFor(city: string): Promise<Tariff> {
  const rows = await query<TariffRow>("SELECT * FROM tariffs WHERE city = $1 OR city = 'Tunis' ORDER BY city = $1 DESC LIMIT 1", [city]);
  return rows[0] ? toTariff(rows[0]) : DEFAULT_TARIFFS[0];
}

export async function saveTariff(t: Tariff) {
  await query(
    `INSERT INTO tariffs VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (city) DO UPDATE SET base_fare=$2, per_km=$3, per_minute=$4, minimum_fare=$5,
       night_multiplier=$6, night_start_hour=$7, night_end_hour=$8, commission_rate=$9`,
    [t.city, t.baseFare, t.perKm, t.perMinute, t.minimumFare, t.nightMultiplier, t.nightStartHour, t.nightEndHour, t.commissionRate],
  );
}

export type Quote = { city: string; route: Route; fare: FareBreakdown };

export async function quote(pickup: LatLng, dropoff: LatLng, at = new Date()): Promise<Quote> {
  const city = nearestCity(pickup);
  const [route, tariff] = await Promise.all([getRoute(pickup, dropoff, at), tariffFor(city)]);
  return { city, route, fare: computeFare(tariff, route.distanceM, route.durationS, at) };
}

type RideRow = {
  id: number; rider_id: number; driver_id: number | null; status: RideStatus; city: string;
  pickup_lat: number; pickup_lng: number; pickup_label: string;
  dropoff_lat: number; dropoff_lng: number; dropoff_label: string;
  distance_m: number; duration_s: number; traffic: string; route: LatLng[];
  fare: string; commission: string; night: boolean; payment_method: PaymentMethod; paid: boolean;
  rating: number | null; detour_m: number; sim_driver_start: LatLng | null;
  requested_at: Date; accepted_at: Date | null; arrived_at: Date | null; started_at: Date | null;
  completed_at: Date | null; cancelled_at: Date | null;
};

type DriverRow = {
  user_id: number; name: string; phone: string; car_model: string; car_color: string; plate: string;
  rating: string; online: boolean; lat: number | null; lng: number | null; last_seen: Date | null; simulated: boolean;
};

const ACTIVE: RideStatus[] = ["requested", "accepted", "arrived", "in_progress"];

export async function createRide(input: {
  riderId: number; pickup: LatLng; dropoff: LatLng; pickupLabel: string; dropoffLabel: string; paymentMethod: PaymentMethod;
}): Promise<number> {
  const active = await query<{ id: number }>("SELECT id FROM rides WHERE rider_id = $1 AND status = ANY($2) LIMIT 1", [input.riderId, ACTIVE]);
  if (active[0]) return active[0].id;
  // Recomputed server-side: the client's quote is only a preview.
  const q = await quote(input.pickup, input.dropoff);
  const rows = await query<{ id: number }>(
    `INSERT INTO rides (rider_id, status, city, pickup_lat, pickup_lng, pickup_label, dropoff_lat, dropoff_lng, dropoff_label,
       distance_m, duration_s, traffic, route, fare, commission, night, payment_method)
     VALUES ($1,'requested',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [
      input.riderId, q.city, input.pickup.lat, input.pickup.lng, input.pickupLabel, input.dropoff.lat, input.dropoff.lng, input.dropoffLabel,
      Math.round(q.route.distanceM), Math.round(q.route.durationS), q.route.traffic, JSON.stringify(q.route.geometry),
      q.fare.total, q.fare.commission, q.fare.night, input.paymentMethod,
    ],
  );
  return rows[0].id;
}

async function loadRide(id: number): Promise<RideRow | null> {
  return (await query<RideRow>("SELECT * FROM rides WHERE id = $1", [id]))[0] ?? null;
}

async function loadDriver(userId: number): Promise<DriverRow | null> {
  return (await query<DriverRow>("SELECT d.*, u.name, u.phone FROM drivers d JOIN users u ON u.id = d.user_id WHERE d.user_id = $1", [userId]))[0] ?? null;
}

const secondsSince = (d: Date, now: Date) => (now.getTime() - d.getTime()) / 1000;
const pickupOf = (r: RideRow): LatLng => ({ lat: r.pickup_lat, lng: r.pickup_lng });

/** Demo mode: hands the ride to a simulated driver and moves them along, based on timestamps. */
async function advanceSimulation(ride: RideRow, now: Date): Promise<RideRow> {
  if (process.env.DEMO_MODE === "false" || !ACTIVE.includes(ride.status)) return ride;

  if (ride.status === "requested") {
    const waited = secondsSince(ride.requested_at, now);
    if (waited < ACCEPT_AFTER_S) return ride;
    const pickup = pickupOf(ride);
    const realDrivers = await query<{ lat: number; lng: number }>(
      `SELECT lat, lng FROM drivers WHERE NOT simulated AND online AND last_seen > now() - interval '60 seconds' AND lat IS NOT NULL`,
    );
    const realNearby = realDrivers.some((d) => haversine(pickup, d) <= OFFER_RADIUS_M);
    if (realNearby && waited < REAL_DRIVER_PRIORITY_S) return ride;
    const candidates = await query<DriverRow>(
      `SELECT d.*, u.name, u.phone FROM drivers d JOIN users u ON u.id = d.user_id
       WHERE d.simulated AND d.user_id NOT IN (SELECT driver_id FROM rides WHERE driver_id IS NOT NULL AND status = ANY($1))`,
      [ACTIVE],
    );
    const best = candidates
      .filter((d) => d.lat !== null && d.lng !== null)
      .map((d) => ({ d, dist: haversine(pickup, { lat: d.lat!, lng: d.lng! }) }))
      .sort((a, b) => a.dist - b.dist)[0];
    // No demo driver in this city: start one 1.5 km away so the demo still works anywhere.
    const start = best && best.dist < 15_000 ? { lat: best.d.lat!, lng: best.d.lng! } : { lat: pickup.lat + 0.012, lng: pickup.lng + 0.006 };
    const driverId = best?.d.user_id;
    if (!driverId) return ride;
    await query(
      `UPDATE rides SET status='accepted', driver_id=$2, accepted_at=$3, sim_driver_start=$4 WHERE id=$1 AND status='requested'`,
      [ride.id, driverId, now, JSON.stringify(start)],
    );
    return (await loadRide(ride.id))!;
  }

  if (!ride.sim_driver_start || !ride.accepted_at) return ride; // a real driver has it
  const elapsed = secondsSince(ride.accepted_at, now) + ACCEPT_AFTER_S;
  const sim = simulate(elapsed, ride.sim_driver_start, pickupOf(ride), ride.route);
  const at = (offset: number) => new Date(ride.accepted_at!.getTime() + (offset - ACCEPT_AFTER_S) * 1000);

  if (sim.driverPos) {
    await query("UPDATE drivers SET lat=$2, lng=$3, last_seen=now() WHERE user_id=$1", [ride.driver_id, sim.driverPos.lat, sim.driverPos.lng]);
  }
  const order: RideStatus[] = ["requested", "accepted", "arrived", "in_progress", "completed"];
  if (order.indexOf(sim.phase) > order.indexOf(ride.status)) {
    await query(
      `UPDATE rides SET status=$2::text,
         arrived_at = COALESCE(arrived_at, CASE WHEN $2::text IN ('arrived','in_progress','completed') THEN $3::timestamptz END),
         started_at = COALESCE(started_at, CASE WHEN $2::text IN ('in_progress','completed') THEN $4::timestamptz END),
         completed_at = COALESCE(completed_at, CASE WHEN $2::text = 'completed' THEN $5::timestamptz END),
         paid = paid OR $2::text = 'completed'
       WHERE id=$1`,
      [ride.id, sim.phase, at(sim.offsets.arrived), at(sim.offsets.started), at(sim.offsets.completed)],
    );
  }
  if (sim.phase === "in_progress" && sim.driverPos) await recordDetour(ride.id, sim.driverPos, ride.route);
  return (await loadRide(ride.id))!;
}

async function recordDetour(rideId: number, pos: LatLng, route: LatLng[]): Promise<number> {
  const off = Math.round(distanceToPolyline(pos, route));
  if (off > DETOUR_THRESHOLD_M) await query("UPDATE rides SET detour_m = GREATEST(detour_m, $2) WHERE id = $1", [rideId, off]);
  return off;
}

export type RideView = {
  id: number;
  status: RideStatus;
  city: string;
  pickup: LatLng & { label: string };
  dropoff: LatLng & { label: string };
  distanceM: number;
  durationS: number;
  traffic: string;
  route: LatLng[];
  fare: number;
  night: boolean;
  paymentMethod: PaymentMethod;
  paid: boolean;
  rating: number | null;
  detourM: number;
  offRouteM: number | null;
  driver: null | { name: string; car: string; color: string; plate: string; rating: number; phone: string; pos: LatLng | null };
  requestedAt: string;
};

export async function getRideView(id: number, now = new Date()): Promise<RideView | null> {
  let ride = await loadRide(id);
  if (!ride) return null;
  ride = await advanceSimulation(ride, now);
  const d = ride.driver_id ? await loadDriver(ride.driver_id) : null;
  const pos = d && d.lat !== null && d.lng !== null ? { lat: d.lat, lng: d.lng } : null;
  return {
    id: ride.id,
    status: ride.status,
    city: ride.city,
    pickup: { lat: ride.pickup_lat, lng: ride.pickup_lng, label: ride.pickup_label },
    dropoff: { lat: ride.dropoff_lat, lng: ride.dropoff_lng, label: ride.dropoff_label },
    distanceM: ride.distance_m,
    durationS: ride.duration_s,
    traffic: ride.traffic,
    route: ride.route,
    fare: Number(ride.fare),
    night: ride.night,
    paymentMethod: ride.payment_method,
    paid: ride.paid,
    rating: ride.rating,
    detourM: ride.detour_m,
    offRouteM: ride.status === "in_progress" && pos ? Math.round(distanceToPolyline(pos, ride.route)) : null,
    driver: d && {
      name: d.name, car: d.car_model, color: d.car_color, plate: d.plate, rating: Number(d.rating), phone: d.phone, pos,
    },
    requestedAt: ride.requested_at.toISOString(),
  };
}

export async function activeRideFor(userId: number, role: "rider" | "driver"): Promise<number | null> {
  const col = role === "rider" ? "rider_id" : "driver_id";
  const rows = await query<{ id: number }>(
    `SELECT id FROM rides WHERE ${col} = $1 AND (status = ANY($2) OR (status = 'completed' AND rating IS NULL AND completed_at > now() - interval '10 minutes'))
     ORDER BY requested_at DESC LIMIT 1`,
    [userId, ACTIVE],
  );
  return rows[0]?.id ?? null;
}

export async function rideOwner(id: number) {
  return (await query<{ rider_id: number; driver_id: number | null; status: RideStatus }>("SELECT rider_id, driver_id, status FROM rides WHERE id=$1", [id]))[0] ?? null;
}

/** State transitions requested by the rider or a real driver. Returns false when not allowed. */
export async function applyAction(
  id: number,
  actor: { uid: number; role: "rider" | "driver" },
  action: "cancel" | "accept" | "arrive" | "start" | "complete" | "rate",
  extra: { rating?: number } = {},
): Promise<boolean> {
  const sql: Record<string, [string, unknown[]]> = {
    cancel: [
      `UPDATE rides SET status='cancelled', cancelled_at=now() WHERE id=$1 AND status IN ('requested','accepted','arrived')
         AND (rider_id=$2 OR driver_id=$2)`,
      [id, actor.uid],
    ],
    accept: [
      `UPDATE rides SET status='accepted', driver_id=$2, accepted_at=now() WHERE id=$1 AND status='requested'
         AND NOT EXISTS (SELECT 1 FROM rides WHERE driver_id=$2 AND status IN ('accepted','arrived','in_progress'))`,
      [id, actor.uid],
    ],
    arrive: [`UPDATE rides SET status='arrived', arrived_at=now() WHERE id=$1 AND status='accepted' AND driver_id=$2`, [id, actor.uid]],
    start: [`UPDATE rides SET status='in_progress', started_at=now() WHERE id=$1 AND status='arrived' AND driver_id=$2`, [id, actor.uid]],
    complete: [
      `UPDATE rides SET status='completed', completed_at=now(), paid=true WHERE id=$1 AND status='in_progress' AND driver_id=$2`,
      [id, actor.uid],
    ],
    rate: [
      `UPDATE rides SET rating=$3 WHERE id=$1 AND status='completed' AND rider_id=$2 AND rating IS NULL`,
      [id, actor.uid, extra.rating],
    ],
  };
  const riderActions = ["cancel", "rate"];
  if (actor.role === "rider" && !riderActions.includes(action)) return false;
  if (actor.role === "driver" && action === "rate") return false;
  if (action === "rate" && !(extra.rating && extra.rating >= 1 && extra.rating <= 5)) return false;
  const [text, params] = sql[action];
  const rows = await query(`${text} RETURNING id`, params);
  return rows.length > 0;
}

export async function updateDriverLocation(driverId: number, pos: LatLng): Promise<{ offRouteM: number | null }> {
  await query("UPDATE drivers SET lat=$2, lng=$3, last_seen=now() WHERE user_id=$1", [driverId, pos.lat, pos.lng]);
  const ride = (await query<{ id: number; route: LatLng[] }>(
    "SELECT id, route FROM rides WHERE driver_id=$1 AND status='in_progress' LIMIT 1",
    [driverId],
  ))[0];
  return { offRouteM: ride ? await recordDetour(ride.id, pos, ride.route) : null };
}

export async function setDriverOnline(driverId: number, online: boolean) {
  await query("UPDATE drivers SET online=$2, last_seen=now() WHERE user_id=$1", [driverId, online]);
}

export async function getDriver(driverId: number) {
  return loadDriver(driverId);
}

/** Open requests near a driver, closest first. */
export async function offersFor(driverId: number) {
  const d = await loadDriver(driverId);
  if (!d || !d.online || d.lat === null || d.lng === null) return [];
  const pos = { lat: d.lat, lng: d.lng };
  const rows = await query<RideRow>("SELECT * FROM rides WHERE status='requested' ORDER BY requested_at DESC LIMIT 50");
  return rows
    .map((r) => ({
      id: r.id,
      pickup: { lat: r.pickup_lat, lng: r.pickup_lng, label: r.pickup_label },
      dropoff: { lat: r.dropoff_lat, lng: r.dropoff_lng, label: r.dropoff_label },
      fare: Number(r.fare),
      earnings: Number(r.fare) - Number(r.commission),
      distanceM: r.distance_m,
      toPickupM: Math.round(haversine(pos, pickupOf(r))),
    }))
    .filter((o) => o.toPickupM <= OFFER_RADIUS_M)
    .sort((a, b) => a.toPickupM - b.toPickupM);
}

export async function registerDriver(userId: number, car: { model: string; color: string; plate: string }) {
  await query(
    `INSERT INTO drivers (user_id, car_model, car_color, plate) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE SET car_model=$2, car_color=$3, plate=$4`,
    [userId, car.model, car.color, car.plate],
  );
}
