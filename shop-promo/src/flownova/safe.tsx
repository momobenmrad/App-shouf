// TikTok safe zone on a 1080×1920 frame: the top bar ("Suivis | Pour toi") covers ~0-230 px, the
// action buttons the right ~150 px from ~760 px down, and the caption/sound the bottom ~380 px.
// Important content stays inside PHONE_SAFE.
export { Backdrop, Phone, Screen } from "../components";
export const PHONE_SAFE = { top: 250, bottom: 1500, left: 70, right: 160, width: 1080 - 70 - 160 } as const;
