import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, Caption, Phone, Screen, Tap, useEnter } from "../components";
import { C, cairo, FPS, inter, PHONE_W } from "../theme";
import { Amira, FlowMark, Logo, Nova, Step } from "./Brand";
import {
  F_TOTAL,
  AFTER_MONTH,
  CTA_BOX,
  CTA_SEND,
  DASH_STOCK,
  FAQ_INSTA,
  FAQ_NOSUB,
  FAQ_ONCE,
  FAQ_ORDER,
  FAQ_PRICE,
  FAQ_TAP,
  LOOP_FADE,
  ORDERS_MAIL,
  ORDERS_TAP,
  PAY_ITEMS,
  PAY_READY,
  PRICE_DT,
  S,
  STORE_APP,
  STORY_DM_EVERY,
  SUBS,
} from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PHONE_H = 1417; // Phone outer height (css(844) + padding)

/** Places the shared Phone centered on (540, cy) at the given scale. */
export const phoneAt = (cy: number, scale: number): React.CSSProperties => ({ top: cy - PHONE_H / 2, scale: String(scale) });

export const usePop = (at: number, stiffness = 180) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping: 14, stiffness } });
};

/** "1 284,500 DT"-style amount (no ICU in headless Chrome, so grouping is manual). */
export const dt = (v: number) => `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DT`;

export const card: React.CSSProperties = {
  position: "absolute",
  background: "#fff",
  borderRadius: 36,
  boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
  color: "#1c1917",
  fontFamily: inter,
  overflow: "hidden",
};

/** Whole-scene entrance: quick zoom-settle so every cut has motion. */
export const SceneIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        scale: String(interpolate(frame, [0, 10], [1.08, 1], clamp)),
        opacity: interpolate(frame, [0, 6], [0, 1], clamp),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Is a subtitle being "spoken" at this absolute frame? Drives Nova's beak. */
const talkingAt = (frame: number) => {
  for (let i = SUBS.length - 1; i >= 0; i--) {
    const [start, text] = SUBS[i];
    if (frame >= start) {
      return frame - start < text.split(" ").length * 11 + 6;
    }
  }
  return false;
};

/** Nova in a corner, commenting the scene (absolute frame offset to sync the beak). */
const CornerNova: React.FC<{ from: number; mood?: "happy" | "worried"; wave?: boolean }> = ({ from, mood, wave }) => {
  const frame = useCurrentFrame();
  const p = usePop(4, 140);
  return (
    <Nova
      size={230}
      mood={mood}
      wave={wave}
      talk={talkingAt(from + frame)}
      style={{ left: 36, top: 1060, scale: String(p), rotate: `${interpolate(p, [0, 1], [-30, 0])}deg` }}
    />
  );
};

export const Pill: React.FC<{ text: string; bg: string; fg: string; style?: React.CSSProperties }> = ({ text, bg, fg, style }) => (
  <span style={{ padding: "8px 20px", borderRadius: 999, background: bg, color: fg, fontWeight: 800, fontSize: 30, ...style }}>{text}</span>
);

// ───────────────────────────── 0. Intro (frame 0 is a complete, moving image)
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Logo size={58} style={{ position: "absolute", top: 150, left: 0, right: 0, justifyContent: "center" }} />
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 300,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: cairo,
          fontWeight: 900,
          fontSize: 104,
          lineHeight: 1.25,
          color: C.white,
          scale: String(1 + Math.sin(frame * 0.18) * 0.02),
          textShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        تبيع على{" "}
        <span style={{ background: C.yellow, color: "#1c1917", padding: "0 22px", borderRadius: 26, display: "inline-block", rotate: "-2deg" }}>
          إنستغرام؟
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - 300,
          top: 650,
          width: 600,
          height: 600,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(20,184,166,0.35), transparent 65%)",
          scale: String(1 + Math.sin(frame * 0.1) * 0.06),
        }}
      />
      <Nova size={520} talk={talkingAt(frame)} wave={frame < 70} style={{ left: 280, top: 690 }} />
      {/* DM bubbles orbiting Nova: the pain in one glance */}
      {["قدّاش السوم؟", "مازال موجود؟", "توصلو لصفاقس؟"].map((t, i) => {
        const a = frame * 0.03 + (i * Math.PI * 2) / 3;
        return (
          <div
            key={t}
            dir="rtl"
            lang="ar"
            style={{
              position: "absolute",
              left: 540 + Math.cos(a) * 380 - 170,
              top: 960 + Math.sin(a) * 250 - 40,
              width: 340,
              textAlign: "center",
              padding: "14px 0",
              borderRadius: 30,
              background: "rgba(255,255,255,0.95)",
              color: "#1c1917",
              fontFamily: cairo,
              fontWeight: 800,
              fontSize: 38,
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
          >
            {t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────────── 1. Story: Amira's Instagram inbox overflows
const DMS: [string, string, string][] = [
  ["سارة", "قدّاش السوم؟", "#f472b6"],
  ["ليلى", "عندكم مقاس كبير؟", "#a78bfa"],
  ["مريم", "توصلو لصفاقس؟", "#60a5fa"],
  ["إيناس", "مازال موجود؟", "#f59e0b"],
  ["نور", "السوم في البريفي", "#34d399"],
  ["هالة", "نجم نخلّص كي يوصل؟", "#fb7185"],
  ["ياسمين", "فما لون أسود؟", "#818cf8"],
  ["سلمى", "وقتاش يوصل؟", "#2dd4bf"],
  ["آمنة", "قدّاش التوصيل؟", "#facc15"],
  ["رحمة", "نحب زوز", "#f97316"],
  ["دُرّة", "السوم؟؟", "#e879f9"],
  ["أسماء", "ردّو عليّا", "#4ade80"],
  ["خلود", "قدّاش السوم؟", "#38bdf8"],
  ["صبرين", "مازال؟", "#c084fc"],
];

const StoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const head = useEnter(0);
  const shown = Math.max(0, Math.min(DMS.length, Math.floor((frame - 40) / STORY_DM_EVERY) + 1));
  const unread = shown === 0 ? 0 : Math.min(120, shown * 9);
  const badge = usePop(40 + (shown - 1) * STORY_DM_EVERY, 300);
  return (
    <SceneIn>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 170,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          opacity: head,
          translate: `0px ${interpolate(head, [0, 1], [-40, 0])}px`,
        }}
      >
        <Amira size={150} />
        <div style={{ fontFamily: cairo, color: C.white }}>
          <div style={{ fontWeight: 900, fontSize: 68, lineHeight: 1.1 }}>أميرة</div>
          <div style={{ fontWeight: 700, fontSize: 38, color: C.muted }}>تبيع حوايج على إنستغرام</div>
        </div>
      </div>
      <Phone style={phoneAt(880, 0.6)}>
        <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: inter }}>
          <div style={{ height: 150, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 36px 22px", borderBottom: "1px solid #eee" }}>
            <span style={{ fontWeight: 800, fontSize: 40 }}>maison.amira</span>
            <span style={{ fontWeight: 700, fontSize: 30, color: "#0095f6" }}>Messages</span>
          </div>
          {DMS.slice(0, shown)
            .reverse()
            .map(([name, msg, col], i) => {
              const isNew = i === 0;
              return (
                <div
                  key={name + msg}
                  dir="rtl"
                  lang="ar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "18px 36px",
                    background: isNew ? "#eff6ff" : "#fff",
                    opacity: isNew ? interpolate(badge, [0, 0.5], [0, 1], clamp) : 1,
                    translate: isNew ? `0px ${interpolate(badge, [0, 1], [-40, 0])}px` : undefined,
                  }}
                >
                  <div style={{ width: 92, height: 92, borderRadius: 99, background: col, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontFamily: cairo }}>
                    <div style={{ fontWeight: 800, fontSize: 34 }}>{name}</div>
                    <div style={{ fontWeight: 700, fontSize: 32, color: "#1c1917" }}>{msg}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 99, background: "#0095f6" }} />
                </div>
              );
            })}
        </div>
      </Phone>
      {shown > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 + PHONE_W * 0.3 - 30,
            top: 420,
            minWidth: 130,
            padding: "10px 24px",
            borderRadius: 999,
            background: "#ef4444",
            color: "#fff",
            fontFamily: inter,
            fontWeight: 900,
            fontSize: 56,
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(239,68,68,0.5)",
            scale: String(interpolate(badge, [0, 1], [1.4, 1])),
          }}
        >
          {unread > 99 ? "99+" : unread}
        </div>
      ) : null}
      <CornerNova from={S.story.from} mood="worried" />
    </SceneIn>
  );
};

// ───────────────────────────── 2. Chaos: notebook, missed calls, unknown monthly total
const NOTES: [string, boolean][] = [
  ["سارة — فستان M — صفاقس", false],
  ["ليلى — 2 قمصان — تونس", true],
  ["مريم — ؟؟ — سوسة", false],
  ["إيناس — رقم ناقص…", true],
  ["نور — بلوزة — ؟؟", false],
];

const PhoneGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"
      fill="#fff"
    />
  </svg>
);

const ChaosScene: React.FC = () => {
  const frame = useCurrentFrame();
  const total = usePop(124, 160); // "و في آخر الشهر؟"
  const dim = interpolate(frame, [122, 134], [1, 0.35], clamp);
  return (
    <SceneIn>
      <div
        style={{
          ...card,
          left: 150,
          top: 300,
          width: 780,
          height: 640,
          background: "repeating-linear-gradient(#fffdf5 0 78px, #bfdbfe 78px 80px)",
          rotate: "-4deg",
          opacity: dim,
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 90, width: 4, background: "#fca5a5" }} />
        {NOTES.map(([t, struck], i) => {
          const at = 6 + i * 18;
          const w = interpolate(frame, [at, at + 14], [0, 100], clamp);
          return (
            <div
              key={t}
              dir="rtl"
              lang="ar"
              style={{
                position: "absolute",
                right: 120,
                top: 60 + i * 110,
                fontFamily: cairo,
                fontWeight: 600,
                fontSize: 48,
                color: "#1e3a8a",
                clipPath: `inset(0 0 0 ${100 - w}%)`,
                rotate: `${(i % 2 ? 1 : -1) * 1.2}deg`,
              }}
            >
              {t}
              {struck ? (
                <div
                  style={{
                    position: "absolute",
                    left: -10,
                    right: -10,
                    top: "52%",
                    height: 6,
                    background: "#dc2626",
                    borderRadius: 3,
                    scale: `${interpolate(frame, [at + 30, at + 40], [0, 1], clamp)} 1`,
                    transformOrigin: "right",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {/* missed calls */}
      {[
        [110, 1010, 56],
        [700, 960, 70],
        [420, 1100, 84],
      ].map(([x, y, at], i) => {
        const p = spring({ frame: frame - at, fps: FPS, config: { damping: 10, stiffness: 220 } });
        const ring = frame > at && frame < at + 60 ? Math.sin(frame * 2.2) * 12 : 0;
        return (
          <div
            key={i}
            dir="rtl"
            lang="ar"
            style={{
              position: "absolute",
              left: x,
              top: y,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 26px",
              borderRadius: 999,
              background: "rgba(239,68,68,0.95)",
              color: "#fff",
              fontFamily: cairo,
              fontWeight: 800,
              fontSize: 36,
              scale: String(p),
              rotate: `${ring}deg`,
              opacity: dim,
            }}
          >
            <PhoneGlyph size={44} />
            مكالمة فايتة
          </div>
        );
      })}
      {/* end of the month: unknown total */}
      <div
        dir="rtl"
        lang="ar"
        style={{
          ...card,
          left: 140,
          top: 470,
          width: 800,
          padding: "50px 0",
          textAlign: "center",
          scale: String(total),
          rotate: `${Math.sin(frame * 1.3) * (frame > 134 && frame < 160 ? 3 : 0)}deg`,
        }}
      >
        <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 52, color: "#57534e" }}>مبيعات الشهر</div>
        <div dir="ltr" style={{ fontFamily: inter, fontWeight: 900, fontSize: 170, color: "#dc2626", letterSpacing: -4 }}>??? DT</div>
      </div>
      <CornerNova from={S.chaos.from} mood="worried" />
    </SceneIn>
  );
};

// ───────────────────────────── 3. Solution: Flownova builds the shop + app
const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = usePop(4, 140);
  const ph = usePop(40, 120);
  const site = usePop(100); // "موقع"
  const app = usePop(122); // "تطبيق"
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [0, 10], [0.9, 0], clamp) }} />
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo size={96} />
      </div>
      <Phone style={{ ...phoneAt(980, 0.55), translate: `0px ${interpolate(ph, [0, 1], [700, 0])}px` }}>
        <Screen src="home-top.png" />
      </Phone>
      {[
        { p: site, x: 70, label: "موقع", sub: "boutique.tn" },
        { p: app, x: 770, label: "تطبيق", sub: "Android · iPhone" },
      ].map(({ p, x, label, sub }) => (
        <div
          key={label}
          style={{
            position: "absolute",
            left: x,
            top: 760,
            width: 240,
            padding: "26px 0",
            borderRadius: 32,
            background: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            textAlign: "center",
            color: C.white,
            scale: String(p),
          }}
        >
          {label === "تطبيق" ? (
            <Img src={staticFile("shots/app-icon.png")} style={{ width: 110, height: 110, borderRadius: 28 }} />
          ) : (
            <div style={{ width: 110, height: 110, margin: "0 auto", borderRadius: 28, background: C.brand, display: "grid", placeItems: "center", fontSize: 64, fontFamily: inter, fontWeight: 900 }}>
              www
            </div>
          )}
          <div lang="ar" style={{ fontFamily: cairo, fontWeight: 900, fontSize: 56, marginTop: 8 }}>{label}</div>
          <div style={{ fontFamily: inter, fontWeight: 600, fontSize: 24, color: C.muted }}>{sub}</div>
        </div>
      ))}
      <CornerNova from={S.solution.from} wave />
    </AbsoluteFill>
  );
};

// ───────────────────────────── 4. Step 1: your own shop + installable app
const StoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = useEnter(0);
  const icon = usePop(STORE_APP + 6, 220);
  const home = interpolate(frame, [STORE_APP - 8, STORE_APP], [0, 1], clamp);
  const ok = usePop(STORE_APP + 30);
  return (
    <SceneIn>
      <Step n={1} title="متجر بإسمك + تطبيق" p={step} />
      <Phone style={phoneAt(900, 0.6)}>
        <Screen src="home-full.png" y={interpolate(frame, [10, 76], [0, 1500], { ...clamp, easing: (t) => t * t * (3 - 2 * t) })} />
        <AbsoluteFill style={{ opacity: home, background: "linear-gradient(160deg,#134e4a,#0f172a)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 44, padding: "190px 48px" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 30, background: "rgba(255,255,255,0.14)" }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: PHONE_W / 2 - 120, top: 620, width: 240, textAlign: "center", scale: String(icon) }}>
            <Img src={staticFile("shots/app-icon.png")} style={{ width: 200, height: 200, borderRadius: 52, boxShadow: "0 0 0 10px rgba(253,224,71,0.85), 0 20px 60px rgba(0,0,0,0.5)" }} />
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 36, marginTop: 14, fontFamily: inter }}>Maison Nour</div>
          </div>
        </AbsoluteFill>
      </Phone>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 1150,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          scale: String(ok),
        }}
      >
        <Pill text="✓ يتحطّ في التليفون في ثانية" bg={C.yellow} fg="#1c1917" style={{ fontFamily: cairo, fontSize: 44, padding: "12px 34px" }} />
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── 5. Step 2: orders in one place + automatic customer e-mail
const ORDERS: [string, string, string, string][] = [
  ["CMD-10006", "Sana Trabelsi", "Sfax", "125,900 DT"],
  ["CMD-10005", "Ines Gharbi", "Sousse", "89,000 DT"],
  ["CMD-10004", "Leila Mansour", "Tunis", "43,000 DT"],
  ["CMD-10003", "Rim Jaziri", "Nabeul", "97,000 DT"],
];

const OrdersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = useEnter(0);
  const shipped = frame >= ORDERS_TAP + 2;
  const flip = usePop(ORDERS_TAP + 2, 260);
  const mail = usePop(ORDERS_MAIL, 150);
  return (
    <SceneIn>
      <Step n={2} title="الكوموندات في بلاصة وحدة" p={step} />
      <div style={{ ...card, left: 70, top: 360, width: 940, padding: "34px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 900, fontSize: 46 }}>Commandes</span>
          <span style={{ fontWeight: 700, fontSize: 26, color: "#0f766e" }}>Exporter CSV · Facture</span>
        </div>
        <div style={{ display: "flex", gap: 26, margin: "20px 0 10px", fontSize: 26, color: "#57534e", fontWeight: 600 }}>
          <span style={{ color: "#1c1917", borderBottom: "4px solid #0f766e" }}>Toutes 4</span>
          <span>Reçue {shipped ? 3 : 4}</span>
          <span>Expédiée {shipped ? 1 : 0}</span>
          <span>Livrée 0</span>
        </div>
        {ORDERS.map(([num, name, city, total], i) => {
          const p = spring({ frame: frame - 10 - i * 7, fps: FPS, config: { damping: 16, stiffness: 160 } });
          const first = i === 0;
          return (
            <div
              key={num}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "22px 0",
                borderTop: "1px solid #eee",
                opacity: p,
                translate: `${interpolate(p, [0, 1], [80, 0])}px 0px`,
              }}
            >
              <div style={{ width: 190, fontWeight: 800, fontSize: 28, color: "#0f766e" }}>{num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 30 }}>{name}</div>
                <div style={{ fontSize: 24, color: "#78716c" }}>{city} · Paiement à la livraison</div>
              </div>
              {first && shipped ? (
                <Pill text="Expédiée" bg="#ccfbf1" fg="#0f766e" style={{ scale: String(interpolate(flip, [0, 1], [1.5, 1])) }} />
              ) : (
                <Pill text="Reçue" bg="#fef3c7" fg="#b45309" />
              )}
              <div style={{ width: 170, textAlign: "right", fontWeight: 800, fontSize: 28 }}>{total}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: 0, width: 940, height: "100%" }}>
          <Tap x={(36 + 190 + 20 + 330 + 60) * (390 / PHONE_W)} y={205 * (390 / PHONE_W) + 10} at={ORDERS_TAP} />
        </div>
      </div>
      {/* customer e-mail sent automatically on the status change */}
      <div
        style={{
          ...card,
          left: 110,
          top: 1110,
          width: 860,
          padding: "26px 30px",
          display: "flex",
          gap: 24,
          alignItems: "center",
          borderRadius: 30,
          opacity: interpolate(mail, [0, 0.4], [0, 1], clamp),
          translate: `0px ${interpolate(mail, [0, 1], [120, 0])}px`,
        }}
      >
        <div style={{ width: 86, height: 86, borderRadius: 22, background: "#0f766e", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width={50} height={50}>
            <path d="M3 6h18v12H3z" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M3 6l9 7 9-7" fill="none" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 24, color: "#78716c", fontWeight: 600 }}>E-mail · Maison Nour → Sana</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>Votre commande CMD-10006 est expédiée</div>
        </div>
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── 6. Step 3: payments ready
const PAYS: [string, string, string][] = [
  ["Paiement à la livraison", "الخلاص عند الاستلام", "#f59e0b"],
  ["Konnect", "e-DINAR · carte", "#2563eb"],
  ["Flouci", "wallet", "#16a34a"],
  ["Carte bancaire", "Stripe", "#635bff"],
];

const PayScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = useEnter(0);
  const ready = usePop(PAY_READY, 200);
  const sel = Math.max(0, PAY_ITEMS.filter((at) => frame >= at + 6).length - 1);
  return (
    <SceneIn>
      <Step n={3} title="الخلاص جاهز" p={step} />
      <div style={{ ...card, left: 90, top: 380, width: 900, padding: "36px 36px 20px" }}>
        <div style={{ fontWeight: 900, fontSize: 44, marginBottom: 14 }}>Mode de paiement</div>
        {PAYS.map(([label, sub, col], i) => {
          const p = spring({ frame: frame - PAY_ITEMS[i], fps: FPS, config: { damping: 13, stiffness: 200 } });
          const on = i === sel && frame >= PAY_ITEMS[0] + 6;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "24px 26px",
                marginBottom: 16,
                borderRadius: 24,
                border: on ? "4px solid #0f766e" : "2px solid #e7e5e4",
                background: on ? "#f0fdfa" : "#fff",
                scale: String(p),
                opacity: p,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 99, border: "4px solid #0f766e", display: "grid", placeItems: "center" }}>
                {on ? <div style={{ width: 20, height: 20, borderRadius: 99, background: "#0f766e" }} /> : null}
              </div>
              <div style={{ width: 66, height: 66, borderRadius: 18, background: col, color: "#fff", fontWeight: 900, fontSize: 34, display: "grid", placeItems: "center" }}>
                {label[0]}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 36 }}>{label}</div>
                <div lang={i === 0 ? "ar" : undefined} style={{ fontFamily: i === 0 ? cairo : inter, fontSize: 26, color: "#78716c", fontWeight: 600 }}>
                  {sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          left: 640,
          top: 1060,
          padding: "16px 40px",
          borderRadius: 24,
          border: `8px solid ${C.yellow}`,
          color: C.yellow,
          fontFamily: cairo,
          fontWeight: 900,
          fontSize: 74,
          rotate: "-10deg",
          scale: String(interpolate(ready, [0, 1], [2.5, 1])),
          opacity: interpolate(ready, [0, 0.3], [0, 1], clamp),
        }}
      >
        ✓ جاهز
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── 7. Step 4: sales of the day / month + stock
const BARS = [3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 12];
const STOCK: [string, number, string, string][] = [
  ["T-shirt coton bio — XL", 0, "#fee2e2", "#dc2626"],
  ["Sac cabas cuir — Cognac", 2, "#fef3c7", "#b45309"],
  ["Bougie Ambre", 3, "#fef3c7", "#b45309"],
];

const DashScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = useEnter(0);
  const count = interpolate(frame, [12, 60], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const stock = usePop(DASH_STOCK, 150);
  return (
    <SceneIn>
      <Step n={4} title="مبيعاتك و الستوك" p={step} />
      <div style={{ position: "absolute", left: 70, top: 350, width: 940, display: "flex", gap: 24 }}>
        {[
          ["Ventes aujourd’hui", dt(845 * count)],
          ["Ventes du mois", dt(12430 * count)],
        ].map(([label, value], i) => {
          const p = spring({ frame: frame - 6 - i * 6, fps: FPS, config: { damping: 15, stiffness: 160 } });
          return (
            <div key={label} style={{ ...card, position: "relative", flex: 1, padding: "28px 30px", scale: String(p) }}>
              <div style={{ fontSize: 28, color: "#78716c", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: -2 }}>{value}</div>
            </div>
          );
        })}
      </div>
      <div style={{ ...card, left: 70, top: 570, width: 940, height: 300, padding: "26px 30px" }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Chiffre d’affaires — 14 derniers jours</div>
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 30, height: 190, display: "flex", alignItems: "flex-end", gap: 14 }}>
          {BARS.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 8,
                background: i === BARS.length - 1 ? "#0f766e" : "#99f6e4",
                height: `${(b / 12) * 100 * interpolate(frame, [20 + i * 3, 40 + i * 3], [0, 1], clamp)}%`,
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          ...card,
          left: 70,
          top: 900,
          width: 940,
          padding: "22px 30px 10px",
          opacity: interpolate(stock, [0, 0.4], [0, 1], clamp),
          translate: `0px ${interpolate(stock, [0, 1], [80, 0])}px`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Stock faible</div>
        {STOCK.map(([name, q, bg, fg]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #eee" }}>
            <span style={{ fontSize: 30, color: "#0f766e", fontWeight: 600 }}>{name}</span>
            <Pill text={String(q)} bg={bg} fg={fg} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 70, top: 312, fontFamily: inter, fontSize: 22, fontWeight: 600, color: C.muted }}>
        Démo — chiffres fictifs
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── 8. After: Amira is done in 15 minutes
const AfterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const face = useEnter(0);
  const ring = interpolate(frame, [10, 80], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 2 });
  const month = usePop(AFTER_MONTH, 160);
  const R = 120;
  return (
    <SceneIn>
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", scale: String(face) }}>
        <Amira size={280} happy />
      </div>
      <div style={{ position: "absolute", left: 110, top: 560, width: 300, height: 300 }}>
        <svg viewBox="0 0 300 300" width={300} height={300}>
          <circle cx="150" cy="150" r={R} stroke="rgba(255,255,255,0.15)" strokeWidth="24" fill="none" />
          <circle
            cx="150"
            cy="150"
            r={R}
            stroke={C.yellow}
            strokeWidth="24"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * R}
            strokeDashoffset={2 * Math.PI * R * (1 - ring * 0.25)}
            transform="rotate(-90 150 150)"
          />
        </svg>
        <div lang="ar" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", color: C.white, fontFamily: cairo, fontWeight: 900, fontSize: 52, lineHeight: 1.1 }}>
          {Math.round(ring * 15)}
          <br />
          دقيقة
        </div>
      </div>
      <div style={{ ...card, left: 460, top: 560, width: 520, padding: "18px 28px" }}>
        {["CMD-10021", "CMD-10022", "CMD-10023", "CMD-10024"].map((n, i) => {
          const done = frame >= 22 + i * 16;
          const p = spring({ frame: frame - 22 - i * 16, fps: FPS, config: { damping: 10, stiffness: 260 } });
          return (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid #eee" : "none" }}>
              <span style={{ fontWeight: 800, fontSize: 32 }}>{n}</span>
              <div style={{ width: 52, height: 52, borderRadius: 99, background: done ? "#0f766e" : "#e7e5e4", color: "#fff", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 900, scale: String(done ? interpolate(p, [0, 1], [1.6, 1]) : 1) }}>
                {done ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", scale: String(month) }}>
        <div style={{ padding: "22px 40px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", color: C.white, fontFamily: inter, fontWeight: 900, fontSize: 48 }}>
          Ce mois : <span style={{ color: C.yellow }}>{dt(12430)}</span>
        </div>
      </div>
      <CornerNova from={S.after.from} />
    </SceneIn>
  );
};

/** Instagram-like profile screen (inside a Phone). */
export const InstaScreen: React.FC<{ handle: string; bio: string; link: string; children?: React.ReactNode }> = ({ handle, bio, link, children }) => (
  <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: inter }}>
    <div style={{ padding: "140px 40px 0", display: "flex", alignItems: "center", gap: 40 }}>
      <div style={{ width: 170, height: 170, borderRadius: 99, padding: 6, background: "linear-gradient(45deg,#f59e0b,#ec4899,#8b5cf6)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#fecdd3", border: "6px solid #fff" }} />
      </div>
      <div style={{ display: "flex", gap: 30, fontSize: 28, textAlign: "center" }}>
        {[["86", "posts"], ["12,4k", "followers"], ["310", "following"]].map(([v, l]) => (
          <div key={l}>
            <div style={{ fontWeight: 800, fontSize: 36 }}>{v}</div>
            {l}
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: "28px 40px", fontSize: 32, lineHeight: 1.4 }}>
      <div style={{ fontWeight: 800 }}>{handle}</div>
      <div lang="ar" dir="rtl" style={{ fontFamily: cairo, textAlign: "left" }}>{bio}</div>
      <div style={{ marginTop: 10, display: "inline-block", padding: "6px 18px", borderRadius: 14, background: "#e0f2fe", color: "#0369a1", fontWeight: 800 }}>
        🔗 {link}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginTop: 20 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "1", background: ["#fde68a", "#fbcfe8", "#c7d2fe", "#bbf7d0", "#fecaca", "#ddd6fe"][i % 6] }} />
      ))}
    </div>
    {children}
  </div>
);

// ───────────────────────────── 9. FAQ: price, then Instagram → link in bio
const Bubble: React.FC<{ text: string; p: number }> = ({ text, p }) => (
  <div
    dir="rtl"
    lang="ar"
    style={{
      position: "absolute",
      top: 190,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      scale: String(p),
    }}
  >
    <div style={{ padding: "18px 44px", borderRadius: 44, background: C.white, color: "#1c1917", fontFamily: cairo, fontWeight: 900, fontSize: 68, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
      {text}
    </div>
  </div>
);

const FaqScene: React.FC = () => {
  const frame = useCurrentFrame();
  const q1 = usePop(2);
  const price = usePop(FAQ_PRICE, 140);
  const once = usePop(FAQ_ONCE);
  const nosub = usePop(FAQ_NOSUB);
  const out = interpolate(frame, [FAQ_INSTA - 10, FAQ_INSTA], [0, 1], clamp);
  const q2 = usePop(FAQ_INSTA);
  const ph = usePop(FAQ_INSTA + 10, 120);
  const shop = interpolate(frame, [FAQ_TAP + 8, FAQ_TAP + 18], [0, 1], clamp);
  const order = usePop(FAQ_ORDER, 180);
  const amount = Math.round(PRICE_DT * interpolate(frame, [FAQ_PRICE, FAQ_PRICE + 30], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 }));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - out, translate: `${-out * 300}px 0px` }}>
        <Bubble text="قدّاش يكلّف؟" p={q1} />
        <div style={{ ...card, left: 140, top: 420, width: 800, padding: "40px 0 46px", textAlign: "center", scale: String(price) }}>
          <div lang="ar" style={{ fontFamily: cairo, fontWeight: 800, fontSize: 48, color: "#57534e" }}>من</div>
          <div style={{ fontWeight: 900, fontSize: 200, letterSpacing: -6, lineHeight: 1, color: "#0f766e" }}>
            {amount}
            <span style={{ fontSize: 80 }}> DT</span>
          </div>
        </div>
        {[
          ["✓ تخلّص مرّة برك", once, 830],
          ["✓ بلاش اشتراك", nosub, 950],
        ].map(([t, p, top]) => (
          <div key={t as string} dir="rtl" lang="ar" style={{ position: "absolute", top: top as number, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(p) }}>
            <Pill text={t as string} bg={C.yellow} fg="#1c1917" style={{ fontFamily: cairo, fontSize: 56, padding: "10px 44px" }} />
          </div>
        ))}
      </AbsoluteFill>
      {frame >= FAQ_INSTA - 2 ? (
        <AbsoluteFill>
          <Bubble text="عندك صفحة إنستغرام؟" p={q2} />
          <Phone style={{ ...phoneAt(860, 0.56), translate: `0px ${interpolate(ph, [0, 1], [900, 0])}px` }}>
            <InstaScreen handle="maison.amira" bio="فساتين و حوايج · توصيل لكل الولايات" link="maison-amira.tn">
              <Tap x={150} y={330} at={FAQ_TAP} />
              <AbsoluteFill style={{ opacity: shop, translate: `${(1 - shop) * PHONE_W}px 0px` }}>
                <Screen src="home-top.png" />
              </AbsoluteFill>
            </InstaScreen>
          </Phone>
          <div
            style={{
              ...card,
              left: 130,
              top: 1110,
              width: 820,
              padding: "22px 28px",
              display: "flex",
              alignItems: "center",
              gap: 22,
              borderRadius: 28,
              opacity: interpolate(order, [0, 0.4], [0, 1], clamp),
              translate: `0px ${interpolate(order, [0, 1], [-80, 0])}px`,
            }}
          >
            <FlowMark size={74} />
            <div>
              <div style={{ fontSize: 24, color: "#78716c", fontWeight: 600 }}>Nouvelle commande · Démo</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>CMD-10025 — 79,000 DT</div>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────────── 10. CTA
const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = usePop(2, 140);
  const box = usePop(CTA_BOX, 160);
  const typed = "Flownova".slice(0, Math.max(0, Math.floor((frame - CTA_BOX - 14) / 3)));
  const sent = usePop(CTA_SEND, 220);
  return (
    <SceneIn>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo size={92} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "0 60px" }}>
        {["متجر + تطبيق", `من ${PRICE_DT} DT`, "بلاش اشتراك"].map((t, i) => {
          const p = spring({ frame: frame - 14 - i * 6, fps: FPS, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={t} dir="rtl" lang="ar" style={{ padding: "10px 30px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", color: C.white, fontFamily: cairo, fontWeight: 800, fontSize: 40, scale: String(p) }}>
              {t}
            </div>
          );
        })}
      </div>
      <Nova size={420} wave talk={talkingAt(S.cta.from + frame)} style={{ left: 330, top: 470 }} />
      <div
        style={{
          ...card,
          left: 90,
          top: 1000,
          width: 900,
          padding: "22px 26px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          borderRadius: 999,
          scale: String(box),
        }}
      >
        <div style={{ width: 70, height: 70, borderRadius: 99, background: "#fecdd3", flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 44, fontWeight: 800, color: typed ? "#1c1917" : "#a8a29e" }}>
          {typed || "Ajouter un commentaire…"}
          {typed && typed.length < 8 && frame % 16 < 8 ? "|" : ""}
        </div>
        <div style={{ width: 76, height: 76, borderRadius: 99, background: frame >= CTA_SEND ? "#fe2c55" : "#e7e5e4", display: "grid", placeItems: "center", scale: String(interpolate(sent, [0, 1], [1.3, 1])) }}>
          <svg viewBox="0 0 24 24" width={40} height={40}>
            <path d="M4 12l16-8-6 16-2-6z" fill="#fff" />
          </svg>
        </div>
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── Subtitles (darija, RTL, word by word)
const Subtitles: React.FC = () => (
  <>
    {SUBS.map(([start, text], i) => {
      const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : F_TOTAL - LOOP_FADE;
      return (
        <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
          <div lang="ar">
            <Caption text={text} top={1340} size={64} stagger={3} delay={i === 0 ? -14 : 0} fontFamily={cairo} dir="rtl" />
          </div>
        </Sequence>
      );
    })}
  </>
);

export const FlownovaVideo: React.FC<{ voice: boolean }> = ({ voice }) => {
  const frame = useCurrentFrame();
  const scenes: [keyof typeof S, React.FC][] = [
    ["intro", IntroScene],
    ["story", StoryScene],
    ["chaos", ChaosScene],
    ["solution", SolutionScene],
    ["store", StoreScene],
    ["orders", OrdersScene],
    ["pay", PayScene],
    ["dash", DashScene],
    ["after", AfterScene],
    ["faq", FaqScene],
    ["cta", CtaScene],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop />
      {scenes.map(([key, Scene]) => (
        <Sequence key={key} from={S[key].from} durationInFrames={S[key].duration} premountFor={30}>
          <Scene />
        </Sequence>
      ))}
      <Subtitles />
      {/* seamless loop: the opening image dissolves back in */}
      <Sequence from={F_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [F_TOTAL - LOOP_FADE, F_TOTAL - 2], [0, 1], clamp) }}>
          <Backdrop />
          <IntroScene />
          <div lang="ar">
            <Caption text={SUBS[0][1]} top={1340} size={64} stagger={3} delay={-14} fontFamily={cairo} dir="rtl" />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile(voice ? "audio/flownova_full.wav" : "audio/flownova_music.wav")} />
    </AbsoluteFill>
  );
};

export const FlownovaComposition: React.FC = () => (
  <Composition
    id="FlownovaExplainer"
    component={FlownovaVideo}
    defaultProps={{ voice: true }}
    durationInFrames={F_TOTAL}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
