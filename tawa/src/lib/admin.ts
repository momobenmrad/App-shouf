import { query } from "./db";

export type Brand = { name: string; nameAr: string; slogan: string; primary: string; accent: string };

export const DEFAULT_BRAND: Brand = { name: "Tawa", nameAr: "توّا", slogan: "تاكسيك توّا", primary: "#F2B544", accent: "#5FB4E0" };

export async function getBrand(): Promise<Brand> {
  try {
    const rows = await query<{ value: Brand }>("SELECT value FROM settings WHERE key='brand'");
    return { ...DEFAULT_BRAND, ...rows[0]?.value };
  } catch {
    // The page shell must still render if the database is down.
    return DEFAULT_BRAND;
  }
}

/** Dark or light text on top of the brand colour, whichever reads better. */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? "#1a1206" : "#ffffff";
}

export async function saveBrand(b: Brand) {
  await query("INSERT INTO settings VALUES ('brand',$1) ON CONFLICT (key) DO UPDATE SET value=$1", [JSON.stringify(b)]);
}

export async function dashboard() {
  const [today] = await query<{ rides: string; completed: string; volume: string | null; commission: string | null; detours: string }>(
    `SELECT count(*) AS rides,
            count(*) FILTER (WHERE status='completed') AS completed,
            sum(fare) FILTER (WHERE status='completed') AS volume,
            sum(commission) FILTER (WHERE status='completed') AS commission,
            count(*) FILTER (WHERE detour_m > 0) AS detours
       FROM rides WHERE requested_at > date_trunc('day', now() AT TIME ZONE 'Africa/Tunis') AT TIME ZONE 'Africa/Tunis'`,
  );
  const [drivers] = await query<{ online: string; total: string }>(
    `SELECT count(*) FILTER (WHERE online AND (simulated OR last_seen > now() - interval '2 minutes')) AS online, count(*) AS total FROM drivers`,
  );
  const byHour = await query<{ h: number; n: string }>(
    `SELECT extract(hour FROM requested_at AT TIME ZONE 'Africa/Tunis')::int AS h, count(*) AS n
       FROM rides WHERE requested_at > now() - interval '24 hours' GROUP BY 1 ORDER BY 1`,
  );
  const recent = await query<{
    id: number; status: string; city: string; pickup_label: string; dropoff_label: string; fare: string;
    payment_method: string; detour_m: number; requested_at: Date; rider: string; driver: string | null;
  }>(
    `SELECT r.id, r.status, r.city, r.pickup_label, r.dropoff_label, r.fare, r.payment_method, r.detour_m, r.requested_at,
            u.name AS rider, d.name AS driver
       FROM rides r JOIN users u ON u.id = r.rider_id LEFT JOIN users d ON d.id = r.driver_id
      ORDER BY r.requested_at DESC LIMIT 30`,
  );
  const driverList = await query<{
    user_id: number; name: string; phone: string; car_model: string; plate: string; rating: string; online: boolean; simulated: boolean;
  }>(
    `SELECT d.user_id, u.name, u.phone, d.car_model, d.plate, d.rating, d.online, d.simulated
       FROM drivers d JOIN users u ON u.id = d.user_id ORDER BY d.simulated, u.name`,
  );
  return {
    rides: Number(today.rides),
    completed: Number(today.completed),
    volume: Number(today.volume ?? 0),
    commission: Number(today.commission ?? 0),
    detours: Number(today.detours),
    driversOnline: Number(drivers.online),
    driversTotal: Number(drivers.total),
    byHour: Array.from({ length: 24 }, (_, h) => Number(byHour.find((r) => r.h === h)?.n ?? 0)),
    recent: recent.map((r) => ({ ...r, fare: Number(r.fare), requested_at: r.requested_at.toISOString() })),
    drivers: driverList.map((d) => ({ ...d, rating: Number(d.rating) })),
  };
}
