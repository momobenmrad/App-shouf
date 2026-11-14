// "Boutique premium" video: 30 fps, 120 BPM (one beat = 15 frames), 25 s.
// audio/make_audio_premium.py places its sounds on these same frame numbers.
export const P = {
  hook: { from: 0, duration: 60 },
  reveal: { from: 60, duration: 120 },
  proofs: { from: 180, duration: 150 },
  orders: { from: 330, duration: 180 },
  compare: { from: 510, duration: 120 },
  cta: { from: 630, duration: 120 },
} as const;
export const P_TOTAL = 750;

// Reveal: the slider sweeps between these local frames, then a flash on the beat.
export const SLIDE_START = 12;
export const SLIDE_END = 84;
export const REVEAL_FLASH = 90;

// Order notifications (local frames in the "orders" scene): slow start, then a rush.
export const ORDER_FRAMES = [24, 45, 60, 72, 82, 90, 97, 103, 108, 113, 117, 121];
export const ORDERS = [
  { city: "Tunis", amount: 125900 },
  { city: "Sfax", amount: 79000 },
  { city: "Sousse", amount: 238500 },
  { city: "Nabeul", amount: 45500 },
  { city: "Bizerte", amount: 149000 },
  { city: "Monastir", amount: 89000 },
  { city: "Gabès", amount: 189000 },
  { city: "Ariana", amount: 118900 },
  { city: "Kairouan", amount: 69000 },
  { city: "Mahdia", amount: 154800 },
  { city: "Hammamet", amount: 98400 },
  { city: "La Marsa", amount: 213700 },
];

// Proofs: three quick beats of 50 frames each.
export const PROOF = { design: 0, cart: 50, cod: 100 } as const;
