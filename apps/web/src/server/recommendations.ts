import 'server-only';
import type { MaturityRating, ViewerProfileRow } from '@chouf/shared';
import { type CardTitle } from './catalog';
import type { UserClient } from './supabase';

const CARD_KEYS = ['id', 'slug', 'kind', 'name', 'poster_path', 'backdrop_path', 'access', 'release_year', 'duration_seconds', 'synopsis'] as const;

const toCards = (rows: Record<string, unknown>[] | null): CardTitle[] =>
  (rows ?? []).map((r) => Object.fromEntries(CARD_KEYS.map((k) => [k, r[k]])) as unknown as CardTitle);

export async function trending(db: UserClient, ratings: MaturityRating[]): Promise<CardTitle[]> {
  const { data } = await db.rpc('trending_titles', { p_ratings: ratings, p_days: 7, p_limit: 18 });
  return toCards(data);
}

export async function forYou(db: UserClient, profile: ViewerProfileRow, ratings: MaturityRating[]): Promise<CardTitle[]> {
  const { data } = await db.rpc('recommended_titles_for_me', { p_profile_id: profile.id, p_ratings: ratings, p_limit: 18 });
  return toCards(data);
}

/** "Because you watched <seed>": the seed is the profile's most recently watched title. */
export async function becauseYouWatched(db: UserClient, profile: ViewerProfileRow, ratings: MaturityRating[]): Promise<{ seed: CardTitle; titles: CardTitle[] } | null> {
  const { data: last } = await db
    .from('playback_progress')
    .select('title_id, titles!inner(id, slug, kind, name, poster_path, backdrop_path, access, release_year, duration_seconds, synopsis)')
    .eq('profile_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return null;
  const seed = last.titles as unknown as CardTitle;
  const { data } = await db.rpc('similar_titles_for_me', { p_title_id: seed.id, p_profile_id: profile.id, p_ratings: ratings, p_limit: 18 });
  const titles = toCards(data);
  return titles.length ? { seed, titles } : null;
}

export async function similarTo(db: UserClient, titleId: string, profile: ViewerProfileRow | null, ratings: MaturityRating[]): Promise<CardTitle[]> {
  if (!profile) return [];
  const { data } = await db.rpc('similar_titles_for_me', { p_title_id: titleId, p_profile_id: profile.id, p_ratings: ratings, p_limit: 12 });
  return toCards(data);
}
