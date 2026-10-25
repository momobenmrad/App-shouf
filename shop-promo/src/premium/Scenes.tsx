import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption, Chip, ease, Phone, Screen, Tap, useEnter } from "../components";
import { C, css, inter, PHONE_W } from "../theme";
import { ORDER_FRAMES, ORDERS, PROOF, REVEAL_FLASH, SLIDE_END, SLIDE_START } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Formatted by hand: the headless renderer has no ICU data for fr-FR grouping.
const dt = (millimes: number) => {
  const whole = Math.floor(millimes / 1000)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${whole},${String(millimes % 1000).padStart(3, "0")} DT`;
};

/** Red rubber-stamp label ("AVANT"). */
const Stamp: React.FC<{ label: string; at: number; color?: string; style?: React.CSSProperties }> = ({
  label,
  at,
  color = "#ef4444",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 260 } });
  return (
    <div
      style={{
        position: "absolute",
        padding: "10px 34px",
        border: `8px solid ${color}`,
        borderRadius: 18,
        color,
        fontFamily: inter,
        fontWeight: 900,
        fontSize: 92,
        letterSpacing: 4,
        background: "rgba(255,255,255,0.85)",
        rotate: "-12deg",
        scale: interpolate(p, [0, 1], [2.6, 1]),
        opacity: interpolate(p, [0, 0.2], [0, 1], clamp),
        ...style,
      }}
    >
      {label}
    </div>
  );
};

/** 0–2 s — result first (a split second), rewind, then the ugly "before". */
export const PremiumHook: React.FC = () => {
  const frame = useCurrentFrame();
  const rewinding = frame >= 10 && frame < 18;
  const showAfter = frame < 14;
  const shake = frame >= 18 && frame < 30 ? Math.sin(frame * 2.4) * interpolate(frame, [18, 30], [14, 0]) : 0;
  return (
    <AbsoluteFill>
      <Caption text="J'ai rendu cette boutique en ligne *PREMIUM*" top={190} size={92} delay={-14} stagger={2} />
      <div
        style={{
          position: "absolute",
          top: 548,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 800,
          fontSize: 46,
          color: C.yellow,
          opacity: interpolate(frame, [26, 34], [0, 1], clamp),
        }}
      >
        …regarde jusqu’à la fin 👀
      </div>
      <Phone style={{ top: 650, translate: `${shake}px 0px`, rotate: `${shake * 0.15}deg` }}>
        <Screen src={showAfter ? "home-top.png" : "before.png"} />
        {rewinding ? (
          <AbsoluteFill
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 9px)",
              mixBlendMode: "difference",
              translate: `0px ${(frame % 3) * 30}px`,
            }}
          />
        ) : null}
      </Phone>
      {frame >= 18 ? <Stamp label="AVANT" at={18} style={{ top: 950, left: 300 }} /> : null}
    </AbsoluteFill>
  );
};

/** 2–6 s — a slider wipes from "before" to "after", flash on the beat. */
export const PremiumReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [SLIDE_START, SLIDE_END], [0, 100], { ...clamp, easing: ease });
  const done = frame >= REVEAL_FLASH;
  const knobX = css(390) * (p / 100);
  return (
    <AbsoluteFill>
      {done ? (
        <Caption text="Même boutique. *Autre_niveau.*" top={200} size={90} delay={REVEAL_FLASH} />
      ) : (
        <Caption text="Avant ➜ Après" top={220} size={96} />
      )}
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 110,
          right: 110,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: inter,
          fontWeight: 900,
          fontSize: 44,
          opacity: done ? 0 : 1,
        }}
      >
        <span style={{ color: "#f87171" }}>AVANT</span>
        <span style={{ color: C.brand }}>APRÈS</span>
      </div>
      <Phone style={{ scale: done ? interpolate(frame, [REVEAL_FLASH, 120], [1.04, 1], clamp) : 1 }}>
        <Screen src="before.png" />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - p}% 0 0)` }}>
          <Screen src="home-top.png" />
        </div>
        {!done && p > 0 && p < 100 ? (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: knobX - 3,
                width: 6,
                background: "#fff",
                boxShadow: "0 0 24px rgba(0,0,0,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: css(844) / 2 - 42,
                left: knobX - 42,
                width: 84,
                height: 84,
                borderRadius: 42,
                background: "#fff",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                display: "grid",
                placeItems: "center",
                fontFamily: inter,
                fontWeight: 900,
                fontSize: 34,
                color: C.brandDeep,
              }}
            >
              ‹ ›
            </div>
          </>
        ) : null}
      </Phone>
      <AbsoluteFill
        style={{
          background: "#fff",
          opacity: interpolate(frame, [REVEAL_FLASH - 1, REVEAL_FLASH, REVEAL_FLASH + 8], [0, 0.85, 0], clamp),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/** 6–11 s — three quick proofs: design, one-tap cart, cash on delivery. */
export const PremiumProofs: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (f: number) => (frame >= f ? 1 : 0);
  const part = frame < PROOF.cart ? 0 : frame < PROOF.cod ? 1 : 2;
  const captions = ["Design *premium*", "Panier en *1_tap*", "Paiement à la *livraison*"];
  const starts = [PROOF.design, PROOF.cart, PROOF.cod];
  const c = PROOF.cart;
  const d = PROOF.cod;
  return (
    <AbsoluteFill>
      <Caption key={part} text={captions[part]} top={230} size={96} delay={starts[part]} />
      <div style={{ position: "absolute", top: 440, left: 0, right: 0, textAlign: "center" }}>
        <span
          style={{
            fontFamily: inter,
            fontWeight: 800,
            fontSize: 40,
            color: C.muted,
          }}
        >
          {part + 1} / 3
        </span>
      </div>
      <Phone>
        {part === 0 ? (
          <Screen
            src="home-full.png"
            y={interpolate(frame, [0, 48], [0, 1240], { ...clamp, easing: ease })}
          />
        ) : null}
        {part === 1 ? (
          <>
            <Screen src="product-0.png" />
            <Screen src="product-1.png" style={{ opacity: at(c + 14) }} />
            <Screen src="product-2.png" style={{ opacity: at(c + 30) }} />
            <Tap x={102} y={508} at={c + 12} />
            <Tap x={270} y={611} at={c + 28} />
          </>
        ) : null}
        {part === 2 ? (
          <>
            <Screen
              src="checkout-full.png"
              y={interpolate(frame, [d, d + 22], [1140, 1580], { ...clamp, easing: ease })}
            />
            <Tap x={195} y={676} at={d + 26} />
            <Screen src="success.png" style={{ opacity: at(d + 30) }} />
          </>
        ) : null}
      </Phone>
    </AbsoluteFill>
  );
};

/** iOS-style notification banner. */
const Notification: React.FC<{ city: string; amount: number; index: number }> = ({ city, amount, index }) => (
  <div
    style={{
      display: "flex",
      gap: 18,
      alignItems: "center",
      padding: "20px 22px",
      borderRadius: 30,
      background: "rgba(245,245,245,0.82)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      fontFamily: inter,
      color: "#111",
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: C.brandDeep,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        fontSize: 34,
        flex: "none",
      }}
    >
      M
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <strong>Maison Nour</strong>
        <span style={{ color: "#6b7280" }}>maintenant</span>
      </div>
      <div style={{ fontSize: 28, marginTop: 4, lineHeight: 1.25 }}>
        🛍️ Nouvelle commande CMD-{10020 + index} · <strong>{dt(amount)}</strong>
      </div>
      <div style={{ fontSize: 24, color: "#4b5563", marginTop: 4 }}>Livraison à {city} — paiement à la livraison</div>
    </div>
  </div>
);

/** 11–17 s — lock screen: order notifications pile up, the total climbs. */
export const PremiumOrders: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrived = ORDER_FRAMES.filter((f) => frame >= f).length;
  const total = ORDERS.slice(0, arrived).reduce((s, o) => s + o.amount, 0);
  const lastAt = arrived ? ORDER_FRAMES[arrived - 1] : 0;
  const bump = arrived ? spring({ frame: frame - lastAt, fps, config: { damping: 10, stiffness: 300 } }) : 1;
  const buzz = arrived && frame - lastAt < 6 ? Math.sin(frame * 3) * 4 : 0;
  return (
    <AbsoluteFill>
      {frame < 20 ? (
        <Caption text="Imagine ce son chaque soir 📱" top={220} size={88} />
      ) : (
        <Caption text="Les commandes *tombent* 🔥" top={220} size={92} delay={20} />
      )}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 900,
          fontSize: 76,
          color: C.yellow,
          opacity: arrived ? 1 : 0,
          scale: interpolate(bump, [0, 1], [1.25, 1]),
        }}
      >
        + {dt(total)}
      </div>
      <div
        style={{
          position: "absolute",
          top: 530,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 600,
          fontSize: 28,
          color: C.muted,
          opacity: arrived ? 0.8 : 0,
        }}
      >
        Démo — commandes simulées
      </div>
      <Phone style={{ translate: `${buzz}px 0px` }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 80% at 30% 0%, ${C.brand}, ${C.brandDeep} 45%, #04211d)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#fff",
            fontFamily: inter,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.9 }}>samedi 25 octobre</div>
          <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05 }}>21:47</div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 400,
            left: 22,
            width: PHONE_W - 44,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {ORDERS.slice(0, arrived)
            .map((o, i) => ({ ...o, i }))
            .reverse()
            .slice(0, 6)
            .map((o, k) => {
              const t = frame - ORDER_FRAMES[o.i];
              return (
                <div
                  key={o.i}
                  style={{
                    translate: `0px ${k === 0 ? interpolate(t, [0, 6], [-120, 0], { ...clamp, easing: ease }) : 0}px`,
                    opacity: k === 0 ? interpolate(t, [0, 4], [0, 1], clamp) : interpolate(k, [3, 5], [1, 0.35], clamp),
                    scale: k === 0 ? interpolate(t, [0, 6], [0.9, 1], clamp) : interpolate(k, [0, 5], [1, 0.94], clamp),
                  }}
                >
                  <Notification city={o.city} amount={o.amount} index={o.i} />
                </div>
              );
            })}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

/** 17–21 s — subscription platform vs. your own site. */
export const PremiumCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = (text: string, ok: boolean, at: number) => {
    const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 220 } });
    return (
      <div
        key={text}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 46,
          fontWeight: 800,
          opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
          translate: `${interpolate(p, [0, 1], [60, 0])}px 0px`,
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            flex: "none",
            display: "grid",
            placeItems: "center",
            fontSize: 34,
            background: ok ? "#fff" : "rgba(239,68,68,0.18)",
            color: ok ? C.brandDeep : "#f87171",
          }}
        >
          {ok ? "✓" : "✗"}
        </span>
        {text}
      </div>
    );
  };
  const card = (title: string, rows: React.ReactNode, style: React.CSSProperties) => (
    <div style={{ borderRadius: 40, padding: "40px 46px", display: "grid", gap: 24, fontFamily: inter, ...style }}>
      <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.85 }}>{title}</div>
      {rows}
    </div>
  );
  const enter2 = useEnter(40);
  return (
    <AbsoluteFill>
      <Caption text="Pourquoi payer *chaque_mois* ?" top={200} size={92} />
      <div style={{ position: "absolute", top: 470, left: 80, right: 80, display: "grid", gap: 36 }}>
        {card(
          "Plateforme à abonnement",
          [row("Abonnement chaque mois", false, 10), row("Applis payantes en plus", false, 18), row("Le site ne t’appartient pas", false, 26)],
          { background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" },
        )}
        <div style={{ scale: interpolate(enter2, [0, 1], [0.85, 1]), opacity: interpolate(enter2, [0, 0.3], [0, 1], clamp) }}>
          {card(
            "Ton site sur mesure",
            [row("0 abonnement", true, 48), row("Paiement à la livraison, Konnect, Flouci", true, 56), row("À toi à 100 %", true, 64)],
            {
              background: `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,
              color: "#fff",
              boxShadow: "0 40px 100px rgba(20,184,166,0.35)",
            },
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 21–25 s — call to action, ends on the "after" screen so the loop restarts cleanly. */
export const PremiumCta: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(6);
  const pulse = 1 + 0.035 * Math.sin((frame / 15) * Math.PI);
  return (
    <AbsoluteFill>
      <Caption text="Ta boutique mérite *ça*" top={200} size={96} />
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 90,
          right: 90,
          padding: "48px 40px",
          borderRadius: 48,
          background: "#fff",
          textAlign: "center",
          fontFamily: inter,
          color: "#0b1f1c",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
          scale: interpolate(enter, [0, 1], [0.6, 1]) * pulse,
          opacity: interpolate(enter, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>Commente</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "8px 40px",
            borderRadius: 24,
            background: C.brand,
            color: "#04211d",
            fontSize: 110,
            fontWeight: 900,
            rotate: "-2deg",
          }}
        >
          SITE
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, marginTop: 24, lineHeight: 1.25 }}>
          et je fais l’avant / après
          <br />
          de <span style={{ color: C.brandDeep, fontWeight: 900 }}>TA</span> boutique gratuitement
        </div>
        <div style={{ fontSize: 76, marginTop: 10, translate: `0px ${8 * Math.sin(frame / 4)}px` }}>👇</div>
      </div>
      <div style={{ position: "absolute", top: 1240, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        <Chip label="Livrée clé en main" at={30} size={36} />
        <Chip label="Hébergée chez toi" at={38} size={36} />
      </div>
      <Img
        src={staticFile("shots/home-top.png")}
        style={{
          position: "absolute",
          top: 1380,
          left: 290,
          width: 500,
          borderRadius: 40,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          opacity: interpolate(frame, [50, 62], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [50, 70], [200, 0], { ...clamp, easing: ease })}px`,
        }}
      />
    </AbsoluteFill>
  );
};
