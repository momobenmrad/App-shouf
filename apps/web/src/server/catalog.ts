import 'server-only';
import type { MaturityRating, TitleRow } from '@chouf/shared';
import { env } from './env';
import type { UserClient } from './supabase';

export type CardTitle = Pick<TitleRow, 'id' | 'slug' | 'kind' | 'name' | 'poster_path' | 'backdrop_path' | 'access' | 'release_year' | 'duration_seconds' | 'synopsis'>;

export const CARD_COLUMNS = 'id, slug, kind, name, poster_path, backdrop_path, access, release_year, duration_seconds, synopsis' as const;

/** Public URL of an artwork path stored in the catalog (served by the edge, no token). */
export function artworkUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env().VOD_BASE_URL.replace(/\/+$/, '')}/a/${path}`;
}

export async function latestTitles(db: UserClient, kind: 'movie' | 'series', ratings: MaturityRating[], limit = 18): Promise<CardTitle[]> {
  const { data } = await db
    .from('titles')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .eq('kind', kind)
    .in('maturity_rating', ratings)
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function featuredTitle(db: UserClient, ratings: MaturityRating[]): Promise<CardTitle | null> {
  const { data } = await db
    .from('titles')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .eq('featured', true)
    .in('maturity_rating', ratings)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export interface ContinueItem {
  title: CardTitle;
  episodeId: string | null;
  position: number;
  duration: number | null;
}

export async function continueWatching(db: UserClient, profileId: string): Promise<ContinueItem[]> {
  const { data } = await db
    .from('playback_progress')
    .select(`position_seconds, duration_seconds, episode_id, titles!inner(${CARD_COLUMNS})`)
    .eq('profile_id', profileId)
    .eq('completed', false)
    .order('updated_at', { ascending: false })
    .limit(12);
  return (data ?? []).map((row) => ({
    title: row.titles as unknown as CardTitle,
    episodeId: row.episode_id,
    position: row.position_seconds,
    duration: row.duration_seconds,
  }));
}
