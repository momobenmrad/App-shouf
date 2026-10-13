import type { MaturityRating } from './database.types';

export const MATURITY_ORDER: readonly MaturityRating[] = ['all', '10+', '12+', '16+', '18+'];

/** Highest rating a kids profile may be given. */
export const KIDS_MAX_RATING: MaturityRating = '12+';

export function maturityRank(rating: MaturityRating): number {
  return MATURITY_ORDER.indexOf(rating);
}

/** Ratings a profile is allowed to see, in ascending order. */
export function allowedRatings(max: MaturityRating): MaturityRating[] {
  return MATURITY_ORDER.slice(0, maturityRank(max) + 1);
}

export function isRatingAllowed(rating: MaturityRating, max: MaturityRating): boolean {
  return maturityRank(rating) <= maturityRank(max);
}
