// "FlownovaEp2": 26 s — "Épisode 2: on transforme une page Instagram en vraie boutique".
// Timed on the ElevenLabs darija voice-over public/audio/flownova/ep2-voice.mp3 (voice "wajdi klai",
// eleven_v4; frames from its ElevenLabs Scribe word timestamps, 30 fps).
// audio/make_audio_flownova_ep2.py mirrors these frame numbers.
export const E2 = {
  hook: { from: 0, duration: 128 }, // "الحلقة الثانية: نحوّلو صفحة إنستغرام لمتجر حقيقي!"
  before: { from: 128, duration: 144 }, // "هاذي Maison Nour…" (4.32 s)
  build: { from: 272, duration: 133 }, // "Flownova يصنعلها متجر…" (9.25 s)
  order: { from: 405, duration: 203 }, // "توّا الكليانة تدخل من البيو…" (13.6 s)
  cta: { from: 608, duration: 172 }, // "تحب نحوّلو صفحتك إنت زادة؟" (20.45 s), voice ends at 24.24 s
} as const;
export const E2_TOTAL = 780;
export const E2_LOOP_FADE = 20;

export const E2_SUBS: [number, string][] = [
  [0, "الحلقة الثانية: نحوّلو صفحة *إنستغرام*"],
  [83, "لمتجر *حقيقي!*"],
  [129, "هاذي *Maison_Nour*"],
  [165, "تبيع بالميساجات *برك…*"],
  [210, "و الكليانات *يستناو* في الرد"],
  [276, "*Flownova* يصنعلها متجر *بإسمها*"],
  [341, "و *بألوانها…* و *تطبيق* في التليفون"],
  [407, "توّا الكليانة تدخل من *البيو*"],
  [456, "تختار المقاس، و *تكومندي…*"],
  [515, "في *أقل_من_دقيقة!*"],
  [557, "و الكوموندة توصل *طول*"],
  [613, "تحب نحوّلو صفحتك إنت *زادة؟*"],
  [665, "اكتب *Flownova* في الكومنتار"],
];

// Local frames inside scenes.
export const BUILD_WIPE = [6, 40] as const; // Instagram screen wipes into the shop
export const BUILD_NAME = 50; // "بإسمها"
export const BUILD_COLORS = 70; // "بألوانها"
export const BUILD_APP = 100; // "تطبيق"
export const ORDER_BIO_TAP = 30; // "من البيو"
export const ORDER_PRODUCT = 40;
export const ORDER_SIZE_TAP = 64; // "المقاس"
export const ORDER_BUY_TAP = 86; // "تكومندي"
export const ORDER_CHECKOUT = 92;
export const ORDER_SUCCESS = 128;
export const ORDER_CLOCK = [26, 128] as const; // stopwatch runs (accelerated) to 0:52
export const ORDER_NOTIF = 156; // "و الكوموندة توصل طول"
export const CTA_BOX2 = 50;
export const CTA_SEND2 = 112;
