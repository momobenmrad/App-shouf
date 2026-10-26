// "Episode1": 14 s, timed on the ElevenLabs voice-over public/audio/voice/episode1.mp3
// (frames at 30 fps measured from its pauses). audio/make_audio_episode1.py uses the same numbers.
export const E = {
  intro: { from: 0, duration: 87 }, // "Épisode 1 : je crée des boutiques en ligne en Tunisie…"
  noSub: { from: 87, duration: 32 }, // "SANS abonnement."
  app: { from: 119, duration: 49 }, // "Site plus appli, clé en main…"
  price: { from: 168, duration: 52 }, // "dès 690 dinars."
  pay: { from: 220, duration: 95 }, // "Paiement à la livraison, Konnect, Flouci : tout est inclus."
  cta: { from: 315, duration: 77 }, // "Commente BOUTIQUE… et je te montre la démo."
  loop: { from: 392, duration: 28 }, // dissolves back into frame 0
} as const;
export const E_TOTAL = 420;

// Local frames inside scenes.
export const APP_TAP = 18; // finger taps the app icon
export const APP_OPEN = 21; // the app zooms open
export const APP_TURNKEY = 27; // "clé en main…"
export const PRICE_COUNT = [4, 34] as const; // 0 → 690 counter
export const PAY_KONNECT = 32;
export const PAY_FLOUCI = 42;
export const PAY_INCLUDED = 67; // "tout est inclus"
export const CTA_DEMO = 32; // "et je te montre la démo"
export const PRICE_DT = 690;
