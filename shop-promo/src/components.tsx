import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, css, inter, PHONE_W } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Dark teal backdrop with a slowly drifting glow and fine grain. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${interpolate(frame, [0, 870], [20, 80])}% ${interpolate(frame, [0, 870], [30, 60])}%, ${C.bg2}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 600px at ${interpolate(frame, [0, 870], [85, 15])}% 85%, rgba(20,184,166,0.18), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          translate: `0px ${-(frame % 36)}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** iPhone-like frame; children fill the 390×844 (scaled) screen. */
export const Phone: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const h = css(844);
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - PHONE_W) / 2 - 16,
        top: 600,
        width: PHONE_W + 32,
        height: h + 32,
        borderRadius: 78,
        background: "linear-gradient(145deg,#2b2f33,#0b0c0d)",
        padding: 16,
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.08) inset, 0 0 80px rgba(20,184,166,0.15)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PHONE_W,
          height: h,
          borderRadius: 62,
          overflow: "hidden",
          background: "#fbfaf8",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: PHONE_W / 2 - 62,
            width: 124,
            height: 36,
            borderRadius: 20,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

/** A screenshot inside the phone screen, optionally panned vertically (offset in css px). */
export const Screen: React.FC<{
  src: string;
  y?: number;
  style?: React.CSSProperties;
}> = ({ src, y = 0, style }) => (
  <Img
    src={staticFile(`shots/${src}`)}
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: PHONE_W,
      translate: `0px ${-css(y)}px`,
      ...style,
    }}
  />
);

/** Finger tap: a dot that presses then a ripple ring. Coordinates in phone css px. */
export const Tap: React.FC<{ x: number; y: number; at: number }> = ({
  x,
  y,
  at,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -8 || t > 22) {
    return null;
  }
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: css(x) - 34,
          top: css(y) - 34,
          width: 68,
          height: 68,
          borderRadius: 34,
          background: "rgba(15,23,42,0.35)",
          border: "4px solid rgba(255,255,255,0.95)",
          scale: interpolate(t, [-8, 0, 4, 22], [1.4, 0.8, 0.9, 0.9], clamp),
          opacity: interpolate(t, [-8, -4, 14, 22], [0, 1, 1, 0], clamp),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: css(x) - 60,
          top: css(y) - 60,
          width: 120,
          height: 120,
          borderRadius: 60,
          border: "5px solid rgba(20,184,166,0.9)",
          scale: interpolate(t, [0, 18], [0.3, 1.4], clamp),
          opacity: interpolate(t, [0, 18], [1, 0], clamp),
        }}
      />
    </>
  );
};

/**
 * TikTok-style kinetic caption: words pop in one after another;
 * words wrapped in *asterisks* get the highlight pill (use _ for spaces inside it).
 */
export const Caption: React.FC<{
  text: string;
  top?: number;
  size?: number;
  delay?: number;
  stagger?: number;
  fontFamily?: string;
  dir?: "ltr" | "rtl";
}> = ({ text, top = 230, size = 84, delay = 0, stagger = 3, fontFamily = inter, dir = "ltr" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      dir={dir}
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${size * 0.12}px ${size * 0.24}px`,
        fontFamily,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: dir === "rtl" ? 0 : -1.5,
        color: C.white,
        textAlign: "center",
      }}
    >
      {words.map((w, i) => {
        const hl = w.startsWith("*") && w.endsWith("*");
        const p = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 14, stiffness: 180 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: hl ? `0 ${size * 0.18}px` : 0,
              borderRadius: size * 0.18,
              background: hl ? C.brand : "transparent",
              color: hl ? "#04211d" : C.white,
              textShadow: hl ? "none" : "0 6px 30px rgba(0,0,0,0.45)",
              scale: interpolate(p, [0, 1], [0.4, 1]),
              translate: `0px ${interpolate(p, [0, 1], [size * 0.5, 0])}px`,
              opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
              rotate: hl ? `${interpolate(p, [0, 1], [-6, -2])}deg` : "0deg",
            }}
          >
            {(hl ? w.slice(1, -1) : w).replace(/_/g, " ")}
          </span>
        );
      })}
    </div>
  );
};

/** Small rounded label used for payment methods and features. */
export const Chip: React.FC<{
  label: string;
  at: number;
  style?: React.CSSProperties;
  size?: number;
}> = ({ label, at, style, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.42}px ${size * 0.7}px`,
        borderRadius: 999,
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(255,255,255,0.18)",
        color: C.white,
        fontFamily: inter,
        fontWeight: 800,
        fontSize: size,
        backdropFilter: "blur(8px)",
        scale: interpolate(p, [0, 1], [0.3, 1]),
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        ...style,
      }}
    >
      <span
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: 999,
          background: C.brand,
          color: "#04211d",
          display: "grid",
          placeItems: "center",
          fontSize: size * 0.45,
          fontWeight: 900,
        }}
      >
        ✓
      </span>
      {label}
    </div>
  );
};

/** Enter animation for a whole scene element: rises and scales in. */
export const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
};
