import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { C, cairo, inter } from "../theme";
import { FlowMark, Nova } from "./Brand";

// Social profile assets (stills): avatars are framed for a circular crop, the cover keeps its
// text inside the centre safe area (Facebook crops the sides on mobile).
const Glow: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #134e4a, ${C.bg} 70%)` }} />
);

const AvatarLogo: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Glow />
    <div style={{ position: "relative" }}>
      <FlowMark size={620} />
    </div>
  </AbsoluteFill>
);

const AvatarNova: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(160deg,#2dd4bf,#0f766e)", alignItems: "center", justifyContent: "center" }}>
    <Nova size={700} style={{ left: 190, top: 150 }} />
  </AbsoluteFill>
);

const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Glow />
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, justifyContent: "center", display: "flex", alignItems: "center", gap: 70 }}>
      <Nova size={300} wave style={{ position: "relative" }} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: inter, fontWeight: 900, fontSize: 110, color: C.white, letterSpacing: -3 }}>
          Flow<span style={{ color: "#2dd4bf", marginLeft: -24 }}>nova</span>
        </div>
        <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 40, color: C.muted, marginTop: 6 }}>
          Boutique en ligne + appli · sans abonnement
        </div>
        <div dir="rtl" lang="ar" style={{ fontFamily: cairo, fontWeight: 800, fontSize: 44, color: C.yellow, marginTop: 8, textAlign: "left", whiteSpace: "nowrap" }}>
          متجرك و تطبيقك، كل شي جاهز
        </div>
      </div>
    </div>
    <Img src={staticFile("shots/app-icon.png")} style={{ display: "none" }} />
  </AbsoluteFill>
);

export const BrandkitCompositions: React.FC = () => (
  <>
    <Composition id="FlownovaAvatarLogo" component={AvatarLogo} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="FlownovaAvatarNova" component={AvatarNova} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="FlownovaCover" component={Cover} durationInFrames={1} fps={30} width={1640} height={624} />
  </>
);
