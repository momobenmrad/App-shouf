import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts (variable woff2 files) so rendering works offline.
export const inter = "Inter";
export const cairo = "Cairo";
loadFont({ family: inter, url: staticFile("fonts/Inter-latin.woff2"), weight: "100 900" });
loadFont({ family: cairo, url: staticFile("fonts/Cairo-arabic.woff2"), weight: "200 1000", unicodeRange: "U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF" });
loadFont({ family: cairo, url: staticFile("fonts/Cairo-latin.woff2"), weight: "200 1000", unicodeRange: "U+0000-00FF" });

export const C = {
  bg: "#07110f",
  bg2: "#0d2420",
  brand: "#14b8a6",
  brandDeep: "#0f766e",
  yellow: "#fde047",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.72)",
};

// 30 fps, 120 BPM: one beat = 15 frames. Scenes start on beats so cuts land on the music.
export const FPS = 30;
export const SCENES = {
  hook: { from: 0, duration: 90 },
  home: { from: 90, duration: 120 },
  product: { from: 210, duration: 150 },
  checkout: { from: 360, duration: 120 },
  languages: { from: 480, duration: 90 },
  admin: { from: 570, duration: 120 },
  features: { from: 690, duration: 75 },
  cta: { from: 765, duration: 105 },
} as const;
export const TOTAL = 870;

// Phone screen: screenshots are 390 css px wide at 3x (1170 px).
export const PHONE_W = 640;
export const css = (px: number) => (px * PHONE_W) / 390;
