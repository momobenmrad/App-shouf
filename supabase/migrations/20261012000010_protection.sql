-- Chouf — Phase 3: content protection level per asset.
-- 'aes128' = HLS AES-128 with a per-asset key served only under the signed playback token.
-- 'drm' is reserved for CENC/Widevine/FairPlay once a licence service is connected.

create type public.asset_protection as enum ('none', 'aes128', 'drm');

alter table public.media_assets
  add column protection public.asset_protection not null default 'none';
