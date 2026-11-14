// "BoutiquePremium15": 15 s cut of the premium video, driven by the ElevenLabs voice-over
// (public/audio/voice/take1.mp3). Frame numbers come from the measured pauses of that take
// (30 fps); audio/make_audio_premium15.py places its sounds on the same frames.
export const V = {
  hook: { from: 0, duration: 103 }, // "Si ta boutique en ligne ressemble à ça… tu perds des clients."
  reveal: { from: 103, duration: 77 }, // "Regarde. Même boutique… version premium."
  proofs: { from: 180, duration: 65 }, // "Panier en un clic, paiement à la livraison."
  orders: { from: 245, duration: 67 }, // "Et le soir… les commandes tombent !"
  cta: { from: 312, duration: 108 }, // "Commente SITE : je fais l'avant-après de TA boutique, gratuitement."
  loop: { from: 420, duration: 30 }, // dissolves back to frame 0 so the video loops seamlessly
} as const;
export const V_TOTAL = 450;

// Hook (local frames): split screen at 50 % on frame 0, then the slider closes on the "before".
export const HOOK_CLOSE = [30, 48] as const;
export const HOOK_PUNCH = 73; // "tu perds des clients"
// Reveal (local): "Regarde" → slider opens on the "after", flash on "version premium".
export const REVEAL_OPEN = [5, 47] as const;
export const REVEAL_SAME = 24; // "Même boutique…"
export const REVEAL_FLASH = 49; // "version premium"
// Proofs (local).
export const PROOF_CART_TAP = 8;
export const PROOF_COD = 32;
export const PROOF_COD_TAP = 36;
// Orders (local): notifications start right after "Et le soir…".
export const ORDERS_WORDS = 36; // "les commandes tombent !"
export const ORDER_HITS = [12, 28, 36, 43, 49, 54, 58, 62];
