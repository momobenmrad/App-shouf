// "FlownovaExplainer": 70 s explainer for the Flownova brand (shop + installable app).
// Timed on the ElevenLabs darija voice-over public/audio/flownova/voice.mp3 (voice "wajdi klai",
// eleven_v4): frames come from its word timestamps (ElevenLabs Scribe transcript, 30 fps).
// audio/make_audio_flownova.py mirrors these frame numbers.
export const S = {
  intro: { from: 0, duration: 170 }, // "عسلامة! أنا نوفا…"
  story: { from: 170, duration: 269 }, // "نعرّفك بأميرة…" (5.68 s)
  chaos: { from: 439, duration: 216 }, // "تكتب الكوموندات في كرّاس…" (14.64 s)
  solution: { from: 655, duration: 175 }, // "هوني يجي Flownova!" (22.0 s)
  store: { from: 830, duration: 160 }, // "واحد: …" (27.76 s)
  orders: { from: 990, duration: 168 }, // "اثنين: …" (33.04 s)
  pay: { from: 1158, duration: 136 }, // "ثلاثة: …" (38.64 s)
  dash: { from: 1294, duration: 134 }, // "أربعة: …" (43.17 s)
  after: { from: 1428, duration: 145 }, // "توّا أميرة…" (47.68 s)
  faq: { from: 1573, duration: 275 }, // "قدّاش يكلّف؟" (52.5 s)
  cta: { from: 1848, duration: 252 }, // "Flownova: متجرك و تطبيقك…" (61.68 s), voice ends at 67.84 s
} as const;
export const F_TOTAL = 2100;
export const LOOP_FADE = 20; // the intro dissolves back in over the last frames

// Subtitles (absolute start frame, darija text). *word* = highlight pill, _ = space inside it.
export const SUBS: [number, string][] = [
  [0, "عسلامة! أنا *نوفا*"],
  [49, "المساعدة متاع *Flownova*"],
  [97, "إذا تبيع أونلاين… هالفيديو *ليك*"],
  [170, "نعرّفك *بأميرة*"],
  [205, "أميرة تبيع حوايج على *إنستغرام*"],
  [267, "و كل نهار، الميساجات *ما_يوفاوش*"],
  [337, "قدّاش السوم؟ عندكم مقاس كبير؟"],
  [402, "توصلو لصفاقس؟"],
  [440, "تكتب الكوموندات في *كرّاس*"],
  [495, "و تكلّم الكليانات واحد بواحد…"],
  [563, "و في آخر الشهر؟ ما تعرفش *قدّاش_باعت*"],
  [658, "هوني يجي *Flownova!*"],
  [707, "نصنعولك متجرك الخاص: *موقع_و_تطبيق*"],
  [795, "و تبدا *تبيع*"],
  [832, "متجر احترافي *بإسمك* و بألوانك"],
  [918, "و *تطبيق* يتحطّ في التليفون في ثانية"],
  [990, "الكوموندات الكل في *بلاصة_وحدة*"],
  [1067, "تبدّل الحالة… و الكليان يوصلو *إيميل* وحدو"],
  [1158, "الخلاص عند الاستلام، *Konnect* و *Flouci*"],
  [1258, "الكل *جاهز*"],
  [1294, "تشوف مبيعات *النهار* و *الشهر*"],
  [1364, "و *الستوك* متاعك، بنظرة وحدة"],
  [1429, "توّا أميرة تكمّل كوموندات النهار في *ربع_ساعة*"],
  [1518, "و تعرف *بالضبط* قدّاش باعت"],
  [1574, "قدّاش يكلّف؟"],
  [1603, "من *690* دينار، تخلّص *مرّة_برك*"],
  [1686, "*بلاش_اشتراك*"],
  [1717, "و عندك صفحة *إنستغرام*؟"],
  [1760, "حطّ رابط متجرك في *البيو…* و الكوموندات تجيك"],
  [1849, "*Flownova:* متجرك و تطبيقك، كل شي جاهز"],
  [1947, "اكتب *Flownova* في الكومنتار… و نبعثلك الديمو"],
];

// Local frames inside scenes (from the word timestamps).
export const STORY_DM_EVERY = 16; // a new DM lands every n frames
export const STORE_APP = 84; // app icon lands on the home screen ("و تطبيق")
export const ORDERS_TAP = 78; // status "Reçue" → "Expédiée" ("تبدّل الحالة")
export const ORDERS_MAIL = 128; // customer e-mail notification ("إيميل")
export const PAY_ITEMS = [18, 60, 80, 94] as const; // COD, Konnect, Flouci, Stripe
export const PAY_READY = 104; // "الكل جاهز"
export const DASH_STOCK = 70; // "و الستوك"
export const AFTER_MONTH = 90; // "و تعرف بالضبط قدّاش باعت"
export const FAQ_PRICE = 28; // "من 690 دينار"
export const FAQ_ONCE = 76; // "تخلّص مرّة برك"
export const FAQ_NOSUB = 112; // "بلاش اشتراك"
export const FAQ_INSTA = 142; // "و عندك صفحة إنستغرام؟"
export const FAQ_TAP = 212; // tap on the bio link ("في البيو")
export const FAQ_ORDER = 252; // "و الكوموندات تجيك"
export const CTA_BOX = 88; // comment box, just before "اكتب Flownova"
export const CTA_SEND = 150; // "نبعثلك الديمو"
export const PRICE_DT = 690;
