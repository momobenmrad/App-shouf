import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Caption, Chip, ease, Phone, Screen, Tap, useEnter } from "./components";
import { C, cairo, inter } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0–3 s — the hook: a bold promise, the phone flies in on the beat. */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(4);
  return (
    <AbsoluteFill>
      <Caption text="J'ai codé une boutique en ligne *COMPLÈTE*" top={210} size={96} stagger={3} delay={-12} />
      <div
        style={{
          position: "absolute",
          top: 575,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 800,
          fontSize: 46,
          color: C.yellow,
          opacity: interpolate(frame, [10, 18], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [10, 22], [20, 0], { ...clamp, easing: ease })}px`,
        }}
      >
        Pas Shopify. Pas WordPress. 0 abonnement.
      </div>
      <Phone
        style={{
          top: 700,
          translate: `0px ${interpolate(enter, [0, 1], [900, 0])}px`,
          rotate: `${interpolate(enter, [0, 1], [12, 0])}deg`,
          scale: interpolate(frame, [4, 90], [0.92, 1], clamp),
        }}
      >
        <Screen src="home-top.png" />
      </Phone>
    </AbsoluteFill>
  );
};

/** 3–7 s — smooth scroll through the homepage. */
export const HomeScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Caption text="Un design *pro* pensé pour le mobile" top={220} size={84} />
      <Phone>
        <Screen
          src="home-full.png"
          y={interpolate(frame, [0, 30, 60, 90, 120], [0, 760, 1230, 2640, 4700], {
            ...clamp,
            easing: ease,
          })}
        />
      </Phone>
    </AbsoluteFill>
  );
};

/** 7–12 s — pick a size, add to cart, the toast confirms. */
export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const show = (from: number) => (frame >= from ? 1 : 0);
  return (
    <AbsoluteFill>
      <Caption
        text={frame < 75 ? "Taille, stock, promos…" : "Ajout au panier en *1_tap*"}
        key={frame < 75 ? "a" : "b"}
        delay={frame < 75 ? 0 : 75}
        top={220}
        size={84}
      />
      <Phone style={{ scale: interpolate(frame, [0, 150], [1, 1.04]) }}>
        <Screen
          src="product-full.png"
          y={interpolate(frame, [0, 28], [0, 560], { ...clamp, easing: ease })}
        />
        <Screen src="product-0.png" style={{ opacity: show(30) }} />
        <Screen src="product-1.png" style={{ opacity: show(62) }} />
        <Screen src="product-2.png" style={{ opacity: show(100) }} />
        <Tap x={102} y={508} at={60} />
        <Tap x={270} y={611} at={96} />
      </Phone>
    </AbsoluteFill>
  );
};

/** 12–16 s — one-page checkout, cash on delivery, success screen. */
export const CheckoutScene: React.FC = () => {
  const frame = useCurrentFrame();
  const success = frame >= 84;
  const pop = useEnter(84);
  return (
    <AbsoluteFill>
      {success ? (
        <Caption text="Commande *reçue* ✅" top={220} size={96} delay={84} />
      ) : (
        <Caption text="Commande en une seule page" top={220} size={84} />
      )}
      <Phone>
        <Screen
          src="checkout-full.png"
          y={interpolate(frame, [0, 40, 70], [0, 1140, 1580], { ...clamp, easing: ease })}
        />
        <Tap x={195} y={676} at={76} />
        {success ? (
          <Screen
            src="success.png"
            style={{
              opacity: interpolate(pop, [0, 0.3], [0, 1], clamp),
              scale: interpolate(pop, [0, 1], [1.08, 1]),
            }}
          />
        ) : null}
      </Phone>
      <div
        style={{
          position: "absolute",
          top: 420,
          left: 80,
          right: 80,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
        }}
      >
        {["Paiement à la livraison", "Konnect", "Flouci", "Stripe"].map((l, i) => (
          <Chip key={l} label={l} at={12 + i * 6} size={34} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 16–19 s — the same shop flips between French, Arabic (RTL) and English. */
export const LanguagesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shots = ["home-top.png", "home-ar.png", "home-en.png"];
  const labels = ["Français", "العربية", "English"];
  const idx = Math.min(2, Math.floor(frame / 30));
  const local = frame - idx * 30;
  return (
    <AbsoluteFill>
      <Caption text="3 langues, arabe *inclus*" top={220} size={88} />
      <div
        style={{
          position: "absolute",
          top: 420,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {labels.map((l, i) => (
          <div
            key={l}
            style={{
              padding: "12px 30px",
              borderRadius: 999,
              fontFamily: i === 1 ? cairo : inter,
              fontWeight: 800,
              fontSize: 40,
              color: i === idx ? "#04211d" : C.white,
              background: i === idx ? C.brand : "rgba(255,255,255,0.1)",
              scale: i === idx ? interpolate(local, [0, 6], [1.15, 1], clamp) : 1,
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <Phone
        style={{
          rotate: `y ${interpolate(local, [0, 8], [idx === 0 ? 0 : 90, 0], { ...clamp, easing: ease })}deg`,
        }}
      >
        <Screen src={shots[idx]} />
      </Phone>
    </AbsoluteFill>
  );
};

/** 19–23 s — the admin back-office in a laptop frame. */
export const AdminScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(0);
  const shot = frame < 60 ? "admin-dashboard.png" : "admin-products.png";
  return (
    <AbsoluteFill>
      <Caption text="Ton client gère *TOUT* seul" top={220} size={92} />
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 700,
          fontSize: 40,
          color: C.muted,
          opacity: interpolate(frame, [10, 20], [0, 1], clamp),
        }}
      >
        Commandes · Produits · Stock · Factures
      </div>
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 40,
          width: 1000,
          translate: `0px ${interpolate(enter, [0, 1], [700, 0])}px`,
          rotate: `${interpolate(enter, [0, 1], [-8, 0])}deg`,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            padding: 14,
            background: "linear-gradient(145deg,#2b2f33,#0b0c0d)",
            boxShadow: "0 60px 120px rgba(0,0,0,0.55), 0 0 80px rgba(20,184,166,0.15)",
          }}
        >
          <div style={{ display: "flex", gap: 8, padding: "2px 6px 12px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
            ))}
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", height: 600, position: "relative" }}>
            <Img
              src={staticFile(`shots/${shot}`)}
              style={{
                width: 972,
                scale: interpolate(frame, [0, 60, 61, 120], [1.3, 1.6, 1.3, 1.6], clamp),
                transformOrigin: frame < 60 ? "62% 8%" : "45% 22%",
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1330,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <Chip label="Tableau de bord" at={18} size={34} />
        <Chip label="Export CSV" at={26} size={34} />
      </div>
    </AbsoluteFill>
  );
};

/** 23–25.5 s — rapid feature burst. */
export const FeaturesScene: React.FC = () => {
  const features = [
    "Paiement à la livraison",
    "Variantes & stock",
    "Codes promo",
    "Factures PDF",
    "E-mails automatiques",
    "SEO Google",
    "Bouton WhatsApp",
    "Installation en 3 min",
  ];
  return (
    <AbsoluteFill>
      <Caption text="Et tout le *reste*" top={260} size={100} />
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        {features.map((f, i) => (
          <Chip key={f} label={f} at={6 + i * 5} size={46} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 25.5–29 s — call to action. */
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(18);
  const pulse = 1 + 0.04 * Math.sin((frame / 15) * Math.PI);
  return (
    <AbsoluteFill>
      <Caption text="Hébergée chez *ton* hébergeur" top={240} size={88} />
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 80,
          right: 80,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 700,
          fontSize: 46,
          color: C.yellow,
          opacity: interpolate(frame, [12, 22], [0, 1], clamp),
        }}
      >
        Dès 3 €/mois · Livrée clé en main
      </div>
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 90,
          right: 90,
          padding: "56px 40px",
          borderRadius: 48,
          background: `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,
          boxShadow: "0 40px 100px rgba(20,184,166,0.35)",
          textAlign: "center",
          fontFamily: inter,
          color: "#fff",
          scale: interpolate(enter, [0, 1], [0.6, 1]) * pulse,
          opacity: interpolate(enter, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 50, fontWeight: 700, opacity: 0.9 }}>Tu veux la même ?</div>
        <div style={{ fontSize: 104, fontWeight: 900, letterSpacing: -2, marginTop: 10 }}>
          Commente
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 18,
            padding: "10px 34px",
            borderRadius: 24,
            background: "#fff",
            color: C.brandDeep,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -1,
          }}
        >
          « BOUTIQUE »
        </div>
        <div style={{ fontSize: 80, marginTop: 18, translate: `0px ${8 * Math.sin(frame / 4)}px` }}>👇</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1290,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 600,
          fontSize: 38,
          color: C.muted,
          opacity: interpolate(frame, [40, 52], [0, 1], clamp),
        }}
      >
        Je t’envoie la démo en privé
      </div>
    </AbsoluteFill>
  );
};

