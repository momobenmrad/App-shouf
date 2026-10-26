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
import { Backdrop, Caption, Chip, ease, Phone, Screen, Tap, useEnter } from "../components";
import { C, cairo, FPS, inter, PHONE_W } from "../theme";
import {
  APP_OPEN,
  APP_TAP,
  APP_TURNKEY,
  CTA_DEMO,
  E,
  E_TOTAL,
  PAY_FLOUCI,
  PAY_INCLUDED,
  PAY_KONNECT,
  PRICE_COUNT,
  PRICE_DT,
} from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Series badge, top of the frame. */
const EpisodeBadge: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      top: 150,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      ...style,
    }}
  >
    <div
      style={{
        padding: "10px 28px",
        borderRadius: 999,
        background: C.yellow,
        color: "#1c1917",
        fontFamily: inter,
        fontWeight: 900,
        fontSize: 38,
        letterSpacing: 3,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      ÉPISODE 1
    </div>
  </div>
);

/** Search keywords written on screen (TikTok indexes on-screen text). */
const Keywords: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      top: 505,
      left: 80,
      right: 80,
      textAlign: "center",
      fontFamily: inter,
      fontWeight: 700,
      fontSize: 36,
      color: C.muted,
      opacity,
    }}
  >
    Création site e-commerce · Tunisie 🇹🇳
  </div>
);

/** Opening look: everything readable on frame 0, while the phone is already scrolling. */
const Opening: React.FC<{ scrollY: number; tilt: number }> = ({ scrollY, tilt }) => (
  <>
    <EpisodeBadge />
    <Caption text="Je crée des *boutiques_en_ligne*" top={240} size={88} delay={-60} />
    <Keywords />
    <Phone style={{ rotate: `${tilt}deg` }}>
      <Screen src="home-full.png" y={scrollY} />
    </Phone>
  </>
);

/** 0–2.9 s — "Épisode 1 : je crée des boutiques en ligne en Tunisie…" */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Opening
        scrollY={interpolate(frame, [0, 87], [350, 2700])}
        tilt={interpolate(frame, [0, 87], [-3, 1])}
      />
    </AbsoluteFill>
  );
};

/** 2.9–4 s — "SANS abonnement." Full-screen type slam. */
const NoSubscription: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 260 } });
  const strike = interpolate(frame, [6, 14], [0, 100], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: inter }}>
      <div style={{ scale: interpolate(slam, [0, 1], [2.4, 1]), opacity: interpolate(slam, [0, 0.3], [0, 1], clamp) }}>
        <div style={{ fontSize: 250, fontWeight: 900, color: C.brand, letterSpacing: -8, lineHeight: 1 }}>SANS</div>
        <div style={{ position: "relative", display: "inline-block", fontSize: 120, fontWeight: 900, color: C.white, marginTop: 10 }}>
          abonnement
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "52%",
              height: 16,
              width: `calc(${strike}% + 20px)`,
              background: "#ef4444",
              borderRadius: 8,
              rotate: "-4deg",
            }}
          />
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: C.yellow, marginTop: 40, opacity: interpolate(frame, [12, 18], [0, 1], clamp) }}>
          0 DT / mois
        </div>
      </div>
    </AbsoluteFill>
  );
};

const HOME_APPS = [
  ["📷", "Photos"], ["💬", "Messages"], ["🎵", "Musique"], ["📅", "Agenda"],
  ["🗺️", "Plans"], ["APP", "Maison Nour"], ["☁️", "Météo"], ["📝", "Notes"],
  ["⚙️", "Réglages"], ["🧮", "Calculette"], ["📚", "Livres"], ["🕒", "Horloge"],
];
const ICON = 118;
const GRID_LEFT = 44;
const GRID_GAP = (PHONE_W - GRID_LEFT * 2 - ICON * 4) / 3;
const GRID_TOP = 210;
const ROW_H = ICON + 70;
const OUR = HOME_APPS.findIndex((a) => a[0] === "APP");
const ourX = GRID_LEFT + (OUR % 4) * (ICON + GRID_GAP);
const ourY = GRID_TOP + Math.floor(OUR / 4) * ROW_H;

/** 4–5.6 s — "Site plus appli, clé en main…" Home screen → tap the shop app → it opens. */
const AppScene: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [APP_OPEN, APP_OPEN + 9], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      {frame < APP_TURNKEY ? (
        <Caption text="Site + *appli* 📲" top={230} size={110} />
      ) : (
        <Caption text="Clé en *main* ✅" top={230} size={110} delay={APP_TURNKEY} />
      )}
      <Keywords opacity={0.9} />
      <Phone>
        <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 20% 0%, #155e75, #0b3b3a 45%, #07110f)" }} />
        <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", color: "#fff", fontFamily: inter, fontSize: 34, fontWeight: 600 }}>
          21:47
        </div>
        {HOME_APPS.map(([icon, label], i) => {
          const x = GRID_LEFT + (i % 4) * (ICON + GRID_GAP);
          const y = GRID_TOP + Math.floor(i / 4) * ROW_H;
          const ours = icon === "APP";
          const pulse = ours && frame < APP_TAP ? 1 + 0.06 * Math.sin(frame / 2.5) : ours && frame < APP_OPEN ? 0.9 : 1;
          return (
            <div key={label} style={{ position: "absolute", left: x, top: y, width: ICON, textAlign: "center", fontFamily: inter }}>
              {ours ? (
                <Img
                  src={staticFile("shots/app-icon.png")}
                  style={{ width: ICON, height: ICON, borderRadius: 28, scale: pulse, boxShadow: "0 0 0 6px rgba(253,224,71,0.85), 0 10px 30px rgba(0,0,0,0.4)" }}
                />
              ) : (
                <div style={{ width: ICON, height: ICON, borderRadius: 28, background: "rgba(255,255,255,0.16)", display: "grid", placeItems: "center", fontSize: 58 }}>
                  {icon}
                </div>
              )}
              <div style={{ color: "#fff", fontSize: 24, marginTop: 10, fontWeight: ours ? 800 : 500, whiteSpace: "nowrap" }}>{label}</div>
            </div>
          );
        })}
        <Tap x={((ourX + ICON / 2) * 390) / PHONE_W} y={((ourY + ICON / 2) * 390) / PHONE_W} at={APP_TAP} />
        {frame >= APP_OPEN ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              borderRadius: interpolate(open, [0, 1], [40, 0]),
              transformOrigin: `${ourX + ICON / 2}px ${ourY + ICON / 2}px`,
              scale: interpolate(open, [0, 1], [ICON / PHONE_W, 1]),
              opacity: interpolate(open, [0, 0.3], [0, 1], clamp),
            }}
          >
            <Screen src="home-top.png" />
          </div>
        ) : null}
      </Phone>
    </AbsoluteFill>
  );
};

/** 5.6–7.3 s — "dès 690 dinars." Counter. */
const Price: React.FC = () => {
  const frame = useCurrentFrame();
  const value = Math.round(interpolate(frame, [...PRICE_COUNT], [0, PRICE_DT], { ...clamp, easing: ease }));
  const done = frame >= PRICE_COUNT[1];
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - PRICE_COUNT[1], fps, config: { damping: 8, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ fontFamily: inter, textAlign: "center" }}>
      <Caption text="Boutique + appli" top={330} size={84} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, fontSize: 80, fontWeight: 800, color: C.muted }}>dès</div>
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          fontSize: 300,
          fontWeight: 900,
          letterSpacing: -10,
          color: C.yellow,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          scale: done ? interpolate(pop, [0, 1], [1.15, 1]) : 1,
          textShadow: "0 20px 60px rgba(253,224,71,0.25)",
        }}
      >
        {value}
        <span style={{ fontSize: 120, letterSpacing: 0, marginInlineStart: 20 }}>DT</span>
      </div>
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
        <Chip label="Paiement unique" at={PRICE_COUNT[1] - 6} size={44} />
        <Chip label="0 abonnement" at={PRICE_COUNT[1]} size={44} />
      </div>
    </AbsoluteFill>
  );
};

/** 7.3–10.5 s — "Paiement à la livraison, Konnect, Flouci : tout est inclus." */
const Payments: React.FC = () => {
  const frame = useCurrentFrame();
  const included = frame >= PAY_INCLUDED;
  return (
    <AbsoluteFill>
      {included ? (
        <Caption text="Tout est *inclus* ✅" top={210} size={100} delay={PAY_INCLUDED} />
      ) : (
        <Caption text="Tous les paiements" top={210} size={88} />
      )}
      <div style={{ position: "absolute", top: 380, left: 70, right: 70, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
        <Chip label="Paiement à la livraison" at={2} size={40} />
        <Chip label="Konnect" at={PAY_KONNECT} size={40} />
        <Chip label="Flouci" at={PAY_FLOUCI} size={40} />
      </div>
      <Phone>
        <Screen src="checkout-full.png" y={interpolate(frame, [0, PAY_INCLUDED], [1040, 1300], { ...clamp, easing: ease })} />
        {included ? <Screen src="success.png" style={{ opacity: interpolate(frame, [PAY_INCLUDED, PAY_INCLUDED + 5], [0, 1], clamp) }} /> : null}
      </Phone>
    </AbsoluteFill>
  );
};

/** 10.5–13 s — "Commente BOUTIQUE… et je te montre la démo." */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(2);
  const pulse = 1 + 0.035 * Math.sin((frame / 15) * Math.PI);
  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <EpisodeBadge />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 90,
          right: 90,
          padding: "52px 40px",
          borderRadius: 48,
          background: "#fff",
          textAlign: "center",
          color: "#0b1f1c",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
          scale: interpolate(enter, [0, 1], [0.6, 1]) * pulse,
          opacity: interpolate(enter, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>Commente</div>
        <div style={{ display: "inline-block", marginTop: 14, padding: "8px 40px", borderRadius: 24, background: C.brand, color: "#04211d", fontSize: 104, fontWeight: 900, rotate: "-2deg" }}>
          BOUTIQUE
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, marginTop: 26, opacity: interpolate(frame, [CTA_DEMO, CTA_DEMO + 6], [0.25, 1], clamp) }}>
          et je te montre la démo
        </div>
        <div style={{ fontSize: 80, marginTop: 6, translate: `0px ${8 * Math.sin(frame / 4)}px` }}>👇</div>
      </div>
      <div style={{ position: "absolute", top: 1030, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip label="Site + appli" at={10} size={40} />
          <Chip label="dès 690 DT" at={16} size={40} />
        </div>
        <Chip label="Clé en main · 0 abonnement" at={22} size={40} />
      </div>
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, textAlign: "center", fontSize: 40, fontWeight: 800, color: C.yellow, opacity: interpolate(frame, [40, 50], [0, 1], clamp) }}>
        Épisode 2 → je crée TA boutique ?
      </div>
      <div style={{ position: "absolute", top: 1400, left: 0, right: 0, textAlign: "center", fontFamily: cairo, fontWeight: 700, fontSize: 36, color: C.muted, opacity: interpolate(frame, [44, 54], [0, 1], clamp) }}>
        متجر إلكتروني + تطبيق · تونس
      </div>
    </AbsoluteFill>
  );
};

/** 13–14 s — dissolve back to the opening so the loop restarts seamlessly. */
const Loop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: ease }) }}>
      <Backdrop />
      <Opening scrollY={350} tilt={-3} />
    </AbsoluteFill>
  );
};

export const Episode1: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {/* Voice-over (ElevenLabs) + beat + sound effects, mixed by audio/make_audio_episode1.py. */}
    <Audio src={staticFile("audio/episode1_full.wav")} />
    <Sequence name="Intro" from={E.intro.from} durationInFrames={E.intro.duration}>
      <Intro />
    </Sequence>
    <Sequence name="Sans abonnement" from={E.noSub.from} durationInFrames={E.noSub.duration}>
      <NoSubscription />
    </Sequence>
    <Sequence name="Appli" from={E.app.from} durationInFrames={E.app.duration}>
      <AppScene />
    </Sequence>
    <Sequence name="Prix" from={E.price.from} durationInFrames={E.price.duration}>
      <Price />
    </Sequence>
    <Sequence name="Paiements" from={E.pay.from} durationInFrames={E.pay.duration}>
      <Payments />
    </Sequence>
    <Sequence name="Appel à l'action" from={E.cta.from} durationInFrames={E.cta.duration}>
      <Cta />
    </Sequence>
    <Sequence name="Boucle" from={E.loop.from} durationInFrames={E.loop.duration}>
      <Loop />
    </Sequence>
  </AbsoluteFill>
);

export const Episode1Composition = () => (
  <Composition id="Episode1" component={Episode1} durationInFrames={E_TOTAL} fps={FPS} width={1080} height={1920} />
);

