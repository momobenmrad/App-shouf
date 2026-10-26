import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, inter } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Nova, the Flownova mascot: a round teal bird with a little star on its head ("nova").
 * `talk` opens the beak in a speaking rhythm, `wave` raises the right wing.
 */
export const Nova: React.FC<{
  size?: number;
  talk?: boolean;
  wave?: boolean;
  mood?: "happy" | "worried";
  style?: React.CSSProperties;
}> = ({ size = 360, talk = false, wave = false, mood = "happy", style }) => {
  const frame = useCurrentFrame();
  const flap = Math.sin(frame * 0.5) * 10;
  const waveAngle = wave ? -28 + Math.sin(frame * 0.35) * 14 : flap;
  const open = talk ? (Math.sin(frame * 0.9) * 0.5 + 0.5) * (Math.sin(frame * 0.23) > -0.6 ? 1 : 0.2) : 0;
  // Blink for 4 frames every ~3 s.
  const blink = (frame + 40) % 95 < 4 ? 0.12 : 1;
  const bob = Math.sin(frame * 0.12) * 10;
  return (
    <svg
      viewBox="0 0 200 210"
      width={size}
      height={size * 1.05}
      style={{ position: "absolute", overflow: "visible", translate: `0px ${bob}px`, ...style }}
    >
      <defs>
        <radialGradient id="nova-body" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="55%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </radialGradient>
        <radialGradient id="nova-glow">
          <stop offset="0%" stopColor="rgba(253,224,71,0.9)" />
          <stop offset="100%" stopColor="rgba(253,224,71,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="200" rx={54 - bob * 0.8} ry="8" fill="rgba(0,0,0,0.3)" style={{ translate: `0px ${-bob}px` }} />
      {/* tail */}
      <path d="M38 130 Q8 120 14 96 Q30 112 46 112 Z" fill="#0d9488" />
      {/* left wing */}
      <g style={{ transformOrigin: "52px 112px", rotate: `${-flap}deg` }}>
        <ellipse cx="40" cy="128" rx="20" ry="34" fill="#0f766e" />
      </g>
      {/* body */}
      <circle cx="100" cy="115" r="72" fill="url(#nova-body)" />
      <ellipse cx="100" cy="142" rx="46" ry="38" fill="#ccfbf1" />
      {/* right wing */}
      <g style={{ transformOrigin: "150px 108px", rotate: `${waveAngle}deg` }}>
        <ellipse cx="162" cy="126" rx="20" ry="34" fill="#0f766e" />
      </g>
      {/* star tuft */}
      <circle cx="100" cy="34" r="26" fill="url(#nova-glow)" />
      <path
        d="M100 14 L106 28 L120 34 L106 40 L100 54 L94 40 L80 34 L94 28 Z"
        fill={C.yellow}
        style={{ transformOrigin: "100px 34px", rotate: `${Math.sin(frame * 0.08) * 15}deg`, scale: String(1 + Math.sin(frame * 0.2) * 0.08) }}
      />
      {/* eyes */}
      {[78, 122].map((x) => (
        <g key={x} style={{ transformOrigin: `${x}px 96px`, scale: `1 ${blink}` }}>
          <circle cx={x} cy="96" r="17" fill="#fff" />
          <circle cx={x + 3} cy="98" r="9" fill="#0b1f1c" />
          <circle cx={x + 6} cy="94" r="3" fill="#fff" />
        </g>
      ))}
      {mood === "worried" ? (
        <>
          <path d="M62 74 L90 80" stroke="#0b1f1c" strokeWidth="5" strokeLinecap="round" />
          <path d="M138 74 L110 80" stroke="#0b1f1c" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : null}
      <circle cx="62" cy="118" r="8" fill="rgba(244,114,182,0.45)" />
      <circle cx="138" cy="118" r="8" fill="rgba(244,114,182,0.45)" />
      {/* beak: the lower half drops while talking */}
      <path d={`M90 122 L110 122 L100 ${130 + open * 12} Z`} fill="#f59e0b" />
      <path d="M88 112 L112 112 L100 126 Z" fill={C.yellow} />
      {/* feet */}
      <path d="M86 186 v10 M80 196 h12 M114 186 v10 M108 196 h12" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

/** Flownova app mark: a rounded square with a flowing wave and the Nova star. */
export const FlowMark: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 120, style }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <defs>
      <linearGradient id="flow-mark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="26" fill="url(#flow-mark)" />
    <path d="M14 64 C30 44 44 82 60 60 S82 46 88 52" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M70 14 L74 25 L85 29 L74 33 L70 44 L66 33 L55 29 L66 25 Z" fill={C.yellow} />
  </svg>
);

/** Mark + "Flownova" wordmark. */
export const Logo: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 64, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3, direction: "ltr", ...style }}>
    <FlowMark size={size * 1.25} />
    <div style={{ fontFamily: inter, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03, color: C.white }}>
      Flow<span style={{ color: "#2dd4bf" }}>nova</span>
    </div>
  </div>
);

/** Amira, the merchant of the story (simple flat avatar). */
export const Amira: React.FC<{ size?: number; happy?: boolean; style?: React.CSSProperties }> = ({ size = 220, happy = false, style }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <circle cx="50" cy="50" r="50" fill={happy ? "#fde68a" : "#fecdd3"} />
    <path d="M16 100 Q18 72 50 70 Q82 72 84 100 Z" fill="#7c3aed" />
    <path d="M26 52 Q24 18 50 18 Q76 18 74 52 Q74 70 64 74 L36 74 Q26 70 26 52 Z" fill="#3b2418" />
    <ellipse cx="50" cy="48" rx="17" ry="20" fill="#e8b48a" />
    <path d="M33 40 Q40 24 64 32 Q60 26 50 25 Q36 26 33 40 Z" fill="#3b2418" />
    <circle cx="43" cy="47" r="2.4" fill="#1c1917" />
    <circle cx="57" cy="47" r="2.4" fill="#1c1917" />
    {happy ? (
      <path d="M42 56 Q50 64 58 56" stroke="#9a3412" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M43 60 Q50 55 57 60" stroke="#9a3412" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    )}
  </svg>
);

/** Small "step" header: big number disc + title (RTL). */
export const Step: React.FC<{ n: number; title: string; p: number }> = ({ n, title, p }) => (
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
      alignItems: "center",
      gap: 26,
      opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
      translate: `0px ${interpolate(p, [0, 1], [-60, 0])}px`,
    }}
  >
    <div
      style={{
        width: 104,
        height: 104,
        borderRadius: 999,
        background: C.yellow,
        color: "#1c1917",
        display: "grid",
        placeItems: "center",
        fontFamily: inter,
        fontWeight: 900,
        fontSize: 64,
        scale: String(interpolate(p, [0, 1], [0.2, 1])),
        rotate: `${interpolate(p, [0, 1], [-90, 0])}deg`,
        boxShadow: "0 12px 40px rgba(253,224,71,0.35)",
      }}
    >
      {n}
    </div>
    <div style={{ fontFamily: "Cairo", fontWeight: 900, fontSize: 70, color: C.white }}>{title}</div>
  </div>
);
