/**
 * Fare computation. Amounts are in Tunisian dinars (DT); 1 DT = 1000 millimes.
 * Tariffs are per city and editable from the back-office; the defaults below are
 * demonstration values, not the official regulated taxi tariff.
 */
export type Tariff = {
  city: string;
  baseFare: number; // prise en charge
  perKm: number;
  perMinute: number;
  minimumFare: number;
  nightMultiplier: number; // applied between nightStartHour and nightEndHour
  nightStartHour: number;
  nightEndHour: number;
  commissionRate: number; // platform share of the fare, 0..1
};

export const DEFAULT_TARIFFS: Tariff[] = [
  { city: "Tunis", baseFare: 0.9, perKm: 0.75, perMinute: 0.06, minimumFare: 3, nightMultiplier: 1.5, nightStartHour: 21, nightEndHour: 5, commissionRate: 0.12 },
  { city: "Sousse", baseFare: 0.8, perKm: 0.7, perMinute: 0.05, minimumFare: 2.5, nightMultiplier: 1.5, nightStartHour: 21, nightEndHour: 5, commissionRate: 0.1 },
  { city: "Sfax", baseFare: 0.8, perKm: 0.68, perMinute: 0.05, minimumFare: 2.5, nightMultiplier: 1.5, nightStartHour: 21, nightEndHour: 5, commissionRate: 0.1 },
];

export type FareBreakdown = {
  base: number;
  distance: number;
  time: number;
  night: boolean;
  total: number;
  commission: number;
  driverEarnings: number;
};

/** Hour of day in Tunisia (UTC+1, no daylight saving since 2009). */
export function tunisHour(at: Date): number {
  return (at.getUTCHours() + 1) % 24;
}

export function isNight(t: Tariff, at: Date): boolean {
  const h = tunisHour(at);
  return t.nightStartHour > t.nightEndHour
    ? h >= t.nightStartHour || h < t.nightEndHour
    : h >= t.nightStartHour && h < t.nightEndHour;
}

/** Rounds to the nearest 100 millimes, the smallest step drivers give change in. */
export const roundDinars = (v: number) => Math.round(v * 10) / 10;

export function computeFare(t: Tariff, distanceM: number, durationS: number, at: Date): FareBreakdown {
  const km = distanceM / 1000;
  const minutes = durationS / 60;
  const night = isNight(t, at);
  const mult = night ? t.nightMultiplier : 1;
  const base = t.baseFare * mult;
  const distance = km * t.perKm * mult;
  const time = minutes * t.perMinute * mult;
  const total = roundDinars(Math.max(t.minimumFare, base + distance + time));
  const commission = Math.round(total * t.commissionRate * 1000) / 1000;
  return {
    base: roundDinars(base),
    distance: roundDinars(distance),
    time: roundDinars(time),
    night,
    total,
    commission,
    driverEarnings: Math.round((total - commission) * 1000) / 1000,
  };
}

/** Formats an amount the Tunisian way: 9.800 DT */
export const formatDT = (v: number) => `${v.toFixed(3)} DT`;
