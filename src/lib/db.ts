import { Pool, type PoolClient } from "pg";
import { DEFAULT_TARIFFS } from "./pricing";
import { DEMO_DRIVERS } from "./simulation";

declare global {
  // Reused across hot reloads in development.
  var __tawaPool: Pool | undefined;
  var __tawaMigrated: Promise<void> | undefined;
}

function pool(): Pool {
  if (!globalThis.__tawaPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant");
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalThis.__tawaPool = new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 5 });
  }
  return globalThis.__tawaPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS tariffs (
  city text PRIMARY KEY,
  base_fare numeric(10,3) NOT NULL,
  per_km numeric(10,3) NOT NULL,
  per_minute numeric(10,3) NOT NULL,
  minimum_fare numeric(10,3) NOT NULL,
  night_multiplier numeric(4,2) NOT NULL,
  night_start_hour int NOT NULL,
  night_end_hour int NOT NULL,
  commission_rate numeric(4,3) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('rider','driver')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drivers (
  user_id int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  car_model text NOT NULL,
  car_color text NOT NULL,
  plate text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 5.0,
  online boolean NOT NULL DEFAULT false,
  lat double precision,
  lng double precision,
  last_seen timestamptz,
  simulated boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS rides (
  id serial PRIMARY KEY,
  rider_id int NOT NULL REFERENCES users(id),
  driver_id int REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('requested','accepted','arrived','in_progress','completed','cancelled')),
  city text NOT NULL,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  pickup_label text NOT NULL,
  dropoff_lat double precision NOT NULL,
  dropoff_lng double precision NOT NULL,
  dropoff_label text NOT NULL,
  distance_m int NOT NULL,
  duration_s int NOT NULL,
  traffic text NOT NULL,
  route jsonb NOT NULL,
  fare numeric(10,3) NOT NULL,
  commission numeric(10,3) NOT NULL,
  night boolean NOT NULL DEFAULT false,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','konnect','flouci','d17')),
  paid boolean NOT NULL DEFAULT false,
  rating int CHECK (rating BETWEEN 1 AND 5),
  detour_m int NOT NULL DEFAULT 0,
  sim_driver_start jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS rides_status_idx ON rides(status);
CREATE INDEX IF NOT EXISTS rides_rider_idx ON rides(rider_id, requested_at DESC);
`;

/** Runs once per process: schema, default tariffs and branding, demo drivers. */
export function ready(): Promise<void> {
  globalThis.__tawaMigrated ??= (async () => {
    const c = await pool().connect();
    try {
      await c.query("SELECT pg_advisory_lock(424242)");
      await c.query(SCHEMA);
      for (const t of DEFAULT_TARIFFS) {
        await c.query(
          `INSERT INTO tariffs VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (city) DO NOTHING`,
          [t.city, t.baseFare, t.perKm, t.perMinute, t.minimumFare, t.nightMultiplier, t.nightStartHour, t.nightEndHour, t.commissionRate],
        );
      }
      await c.query(`INSERT INTO settings VALUES ('brand', $1) ON CONFLICT (key) DO NOTHING`, [
        JSON.stringify({ name: "Tawa", nameAr: "توّا", slogan: "تاكسيك توّا", primary: "#F2B544", accent: "#5FB4E0" }),
      ]);
      if (process.env.DEMO_MODE !== "false") await seedDemoDrivers(c);
      await c.query("SELECT pg_advisory_unlock(424242)");
    } finally {
      c.release();
    }
  })().catch((err) => {
    globalThis.__tawaMigrated = undefined;
    throw err;
  });
  return globalThis.__tawaMigrated;
}

async function seedDemoDrivers(c: PoolClient) {
  for (const [i, d] of DEMO_DRIVERS.entries()) {
    const phone = `+216 00 000 ${String(i).padStart(3, "0")}`;
    const { rows } = await c.query(
      `INSERT INTO users (phone, name, role) VALUES ($1,$2,'driver') ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [phone, d.name],
    );
    await c.query(
      `INSERT INTO drivers (user_id, car_model, car_color, plate, rating, online, lat, lng, last_seen, simulated)
       VALUES ($1,$2,$3,$4,$5,true,$6,$7,now(),true) ON CONFLICT (user_id) DO NOTHING`,
      [rows[0].id, d.car, d.color, d.plate, d.rating, d.pos.lat, d.pos.lng],
    );
  }
}

export async function query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  const { rows } = await pool().query(sql, params);
  return rows as T[];
}
