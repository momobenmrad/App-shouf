// "Episode3": 15 s, French ElevenLabs voice-over (voice "Raphael", as in Episode 1)
// public/audio/voice/episode3.mp3 (14.4 s), timed on its pauses (ffmpeg silencedetect, 30 fps).
// audio/make_audio_episode3.py mirrors these frames.
export const T = {
  orders: 114, // "Ta cliente, elle, commande…"
  ding: 178, // "Ding !"
  stock: 196, // "Stock mis à jour"
  mail: 224, // "e-mail envoyé"
  morning: 255, // "Au réveil : trois commandes."
  offer: 308, // "Dernier jour : ta boutique à 590 dinars."
  cta: 401, // "Commente Flownova !"
};
export const E3_TOTAL = 450;
export const E3_LOOP_FADE = 15;

// French subtitles: [start frame, text]; *word* = highlight pill.
export const E3_SUBS: [number, string][] = [
  [0, "Épisode 3. Il est *2h* du matin…"],
  [89, "tu *dors.*"],
  [114, "Ta cliente, elle, *commande*"],
  [178, "*Ding_!* Stock mis à jour,"],
  [224, "*e-mail* envoyé."],
  [255, "Au réveil : *3_commandes.*"],
  [308, "*Dernier_jour_:* 590 dinars."],
  [401, "Commente *Flownova_!*"],
];
