// "FlownovaExplainer": 80 s explainer for the Flownova brand (shop + installable app).
// No voice track yet (ElevenLabs refused the generation): the darija text runs as on-screen
// subtitles, and SUBS doubles as the recording script — record each line at its frame and drop
// the file in public/audio/flownova/voice.mp3, then render with --props='{"voice":true}'.
// audio/make_audio_flownova.py mirrors these frame numbers.
export const S = {
  intro: { from: 0, duration: 150 },
  story: { from: 150, duration: 270 },
  chaos: { from: 420, duration: 240 },
  solution: { from: 660, duration: 180 },
  store: { from: 840, duration: 210 },
  orders: { from: 1050, duration: 210 },
  pay: { from: 1260, duration: 180 },
  dash: { from: 1440, duration: 210 },
  after: { from: 1650, duration: 210 },
  faq: { from: 1860, duration: 330 },
  cta: { from: 2190, duration: 210 },
} as const;
export const F_TOTAL = 2400;
export const LOOP_FADE = 20; // the intro dissolves back in over the last frames

// Subtitles (absolute start frame, darija text). *word* = highlight pill, _ = space inside it.
export const SUBS: [number, string][] = [
  [0, "عسلامة! أنا *نوفا*"],
  [45, "المساعدة متاع *Flownova*"],
  [90, "إذا تبيع أونلاين… هالفيديو *ليك*"],
  [150, "نعرّفك *بأميرة*"],
  [190, "أميرة تبيع حوايج على *إنستغرام*"],
  [250, "و كل نهار، الميساجات *ما_يوفاوش*"],
  [310, "قدّاش السوم؟ عندكم مقاس كبير؟"],
  [370, "توصلو لصفاقس؟"],
  [420, "تكتب الكوموندات في *كرّاس*"],
  [490, "و تكلّم الكليانات واحد بواحد…"],
  [560, "و في آخر الشهر؟ ما تعرفش *قدّاش_باعت*"],
  [660, "هوني يجي *Flownova!*"],
  [720, "نصنعولك متجرك الخاص: *موقع_و_تطبيق*"],
  [790, "و تبدا *تبيع*"],
  [840, "متجر احترافي *بإسمك* و بألوانك"],
  [930, "و *تطبيق* يتحطّ في التليفون في ثانية"],
  [1050, "الكوموندات الكل في *بلاصة_وحدة*"],
  [1140, "تبدّل الحالة… و الكليان يوصلو *إيميل* وحدو"],
  [1260, "الخلاص عند الاستلام، *Konnect* و *Flouci*"],
  [1370, "الكل *جاهز*"],
  [1440, "تشوف مبيعات *النهار* و *الشهر*"],
  [1540, "و *الستوك* متاعك، بنظرة وحدة"],
  [1650, "توّا أميرة تكمّل كوموندات النهار في *ربع_ساعة*"],
  [1760, "و تعرف *بالضبط* قدّاش باعت"],
  [1860, "قدّاش يكلّف؟"],
  [1900, "من *690* دينار، تخلّص *مرّة_برك*"],
  [1980, "*بلاش_اشتراك*"],
  [2030, "عندك صفحة *إنستغرام*؟"],
  [2090, "حطّ رابط متجرك في *البيو*… و الكوموندات تجيك"],
  [2190, "*Flownova:* متجرك و تطبيقك، كل شي جاهز"],
  [2280, "اكتب *Flownova* في الكومنتار… و نبعثلك الديمو"],
];

// Local frames inside scenes.
export const STORY_DM_EVERY = 16; // a new DM lands every n frames
export const ORDERS_TAP = 96; // status "Reçue" → "Expédiée"
export const ORDERS_MAIL = 112; // customer e-mail notification slides in
export const PAY_ITEMS = [14, 34, 54, 74] as const;
export const PAY_READY = 110;
export const STORE_APP = 96; // app icon lands on the home screen
export const FAQ_PRICE = 40;
export const FAQ_INSTA = 170;
export const FAQ_TAP = 250; // tap on the bio link
export const PRICE_DT = 690;
