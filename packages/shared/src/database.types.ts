// Database types for supabase-js, mirroring supabase/migrations.
// Regenerate with `supabase gen types typescript --local > packages/shared/src/database.types.ts`
// once a Supabase project is linked; this hand-written version keeps the same shape.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type I18nText = Partial<Record<'ar' | 'fr' | 'en', string>>;

type Rel<FK extends string, Cols extends string[], Ref extends string, One extends boolean = false> = {
  foreignKeyName: FK;
  columns: Cols;
  isOneToOne: One;
  referencedRelation: Ref;
  referencedColumns: ['id'];
};

/** Builds Row/Insert/Update from a row type and the keys that have database defaults. */
type Table<Row, Defaulted extends keyof Row, R extends unknown[] = []> = {
  Row: Row;
  Insert: Omit<Row, Defaulted> & Partial<Pick<Row, Defaulted>>;
  Update: Partial<Row>;
  Relationships: R;
};

export type UserRole = 'viewer' | 'admin';
export type AccessLevel = 'free' | 'subscriber';
export type PublishStatus = 'draft' | 'published' | 'archived';
export type AppLocale = 'ar' | 'fr' | 'en';
export type AssetStatus = 'uploading' | 'uploaded' | 'queued' | 'processing' | 'ready' | 'failed';
export type JobStatus = 'queued' | 'active' | 'completed' | 'failed';
export type TitleKind = 'movie' | 'series';
export type BillingInterval = 'month' | 'year';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'canceled';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';
export type ChannelStatus = 'active' | 'inactive';
export type SourceKind = 'external_hls' | 'internal_ingest';
export type SourceHealth = 'unknown' | 'healthy' | 'degraded' | 'down';
export type IncidentKind = 'down' | 'degraded' | 'failover' | 'failback' | 'license_expired' | 'all_sources_down';
export type LiveEventStatus = 'scheduled' | 'live' | 'ended';

export type Rendition = {
  name: string;
  width: number;
  height: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
};

export type LicenseInfo = {
  holder: string;
  agreement_ref: string;
  /** YYYY-MM-DD, last day the licence is valid. */
  expires_at: string;
  /** ISO 3166-1 alpha-2 codes. */
  territories: string[];
  notes?: string;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  locale: AppLocale;
  role: UserRole;
  country: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaAssetRow = {
  id: string;
  status: AssetStatus;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  source_key: string;
  upload_id: string | null;
  hls_prefix: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  renditions: Rendition[];
  progress: number;
  error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TranscodeJobRow = {
  id: string;
  asset_id: string;
  queue_job_id: string | null;
  status: JobStatus;
  attempt: number;
  started_at: string | null;
  finished_at: string | null;
  log: string | null;
  created_at: string;
};

export type SubtitleTrackRow = {
  id: string;
  asset_id: string;
  lang: string;
  label: string;
  path: string;
  is_default: boolean;
};

export type TitleRow = {
  id: string;
  kind: TitleKind;
  slug: string;
  name: I18nText;
  synopsis: I18nText;
  release_year: number | null;
  maturity_rating: MaturityRating;
  poster_path: string | null;
  backdrop_path: string | null;
  access: AccessLevel;
  status: PublishStatus;
  featured: boolean;
  geo_allow: string[];
  asset_id: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type GenreRow = {
  id: string;
  slug: string;
  name: I18nText;
};

export type TitleGenreRow = {
  title_id: string;
  genre_id: string;
};

export type SeasonRow = {
  id: string;
  title_id: string;
  number: number;
  name: I18nText;
  created_at: string;
};

export type EpisodeRow = {
  id: string;
  season_id: string;
  number: number;
  name: I18nText;
  synopsis: I18nText;
  access: AccessLevel | null;
  status: PublishStatus;
  asset_id: string | null;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
};

export type MaturityRating = 'all' | '10+' | '12+' | '16+' | '18+';

export type ViewerProfileRow = {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  color: number;
  is_kids: boolean;
  maturity_max: MaturityRating;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PlaybackProgressRow = {
  user_id: string;
  profile_id: string;
  asset_id: string;
  title_id: string;
  episode_id: string | null;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string;
};

export type PlanRow = {
  id: string;
  code: string;
  name: I18nText;
  price_millimes: number;
  currency: string;
  interval: BillingInterval;
  max_streams: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  provider: string;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_id: string | null;
  provider: string;
  provider_ref: string | null;
  amount_millimes: number;
  currency: string;
  status: PaymentStatus;
  raw: Json | null;
  paid_at: string | null;
  created_at: string;
};

export type PlaybackSessionRow = {
  id: string;
  user_id: string;
  asset_id: string | null;
  channel_id: string | null;
  event_id: string | null;
  profile_id: string | null;
  device_id: string;
  country: string | null;
  started_at: string;
  last_heartbeat_at: string;
  ended_at: string | null;
};

export type ChannelRow = {
  id: string;
  slug: string;
  name: I18nText;
  logo_path: string | null;
  category: 'general' | 'news' | 'sports' | 'kids' | 'entertainment' | 'religious' | 'music' | 'documentary';
  country: string;
  language: string;
  status: ChannelStatus;
  access: AccessLevel;
  active_source_id: string | null;
  auto_disabled_reason: string | null;
  sort_order: number;
  epg_url: string | null;
  epg_channel_id: string | null;
  epg_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EpgProgramRow = {
  id: number;
  channel_id: string;
  start_at: string;
  end_at: string;
  title: I18nText;
  description: I18nText;
  category: string | null;
  rating: string | null;
  external_id: string | null;
};

export type ChannelSourceRow = {
  id: string;
  channel_id: string;
  label: string;
  kind: SourceKind;
  url: string;
  priority: number;
  enabled: boolean;
  license_info: LicenseInfo;
  health: SourceHealth;
  consecutive_failures: number;
  consecutive_successes: number;
  last_checked_at: string | null;
  last_media_sequence: number | null;
  last_sequence_change_at: string | null;
  last_latency_ms: number | null;
  last_bitrate_kbps: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveEventRow = {
  id: string;
  slug: string;
  name: I18nText;
  description: I18nText;
  poster_path: string | null;
  access: AccessLevel;
  geo_allow: string[];
  published: boolean;
  status: LiveEventStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  stream_path: string;
  chat_enabled: boolean;
  record: boolean;
  replay_asset_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveEventKeyRow = {
  event_id: string;
  key_hash: string;
  rotated_at: string;
};

export type ChatMessageRow = {
  id: number;
  event_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type SourceHealthCheckRow = {
  id: number;
  source_id: string;
  checked_at: string;
  ok: boolean;
  http_status: number | null;
  latency_ms: number | null;
  bitrate_kbps: number | null;
  error: string | null;
};

export type SourceIncidentRow = {
  id: string;
  channel_id: string;
  source_id: string | null;
  kind: IncidentKind;
  started_at: string;
  resolved_at: string | null;
  details: Json;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'display_name' | 'locale' | 'role' | 'country' | 'created_at' | 'updated_at'>;
      media_assets: Table<
        MediaAssetRow,
        | 'id'
        | 'status'
        | 'upload_id'
        | 'hls_prefix'
        | 'duration_seconds'
        | 'width'
        | 'height'
        | 'renditions'
        | 'progress'
        | 'error'
        | 'created_by'
        | 'created_at'
        | 'updated_at'
      >;
      transcode_jobs: Table<
        TranscodeJobRow,
        'id' | 'queue_job_id' | 'status' | 'attempt' | 'started_at' | 'finished_at' | 'log' | 'created_at',
        [Rel<'transcode_jobs_asset_id_fkey', ['asset_id'], 'media_assets'>]
      >;
      subtitle_tracks: Table<
        SubtitleTrackRow,
        'id' | 'is_default',
        [Rel<'subtitle_tracks_asset_id_fkey', ['asset_id'], 'media_assets'>]
      >;
      titles: Table<
        TitleRow,
        | 'id'
        | 'synopsis'
        | 'release_year'
        | 'maturity_rating'
        | 'poster_path'
        | 'backdrop_path'
        | 'access'
        | 'status'
        | 'featured'
        | 'geo_allow'
        | 'asset_id'
        | 'duration_seconds'
        | 'published_at'
        | 'search_text'
        | 'created_at'
        | 'updated_at',
        [Rel<'titles_asset_id_fkey', ['asset_id'], 'media_assets'>]
      >;
      genres: Table<GenreRow, 'id'>;
      title_genres: Table<
        TitleGenreRow,
        never,
        [
          Rel<'title_genres_title_id_fkey', ['title_id'], 'titles'>,
          Rel<'title_genres_genre_id_fkey', ['genre_id'], 'genres'>,
        ]
      >;
      seasons: Table<
        SeasonRow,
        'id' | 'name' | 'created_at',
        [Rel<'seasons_title_id_fkey', ['title_id'], 'titles'>]
      >;
      episodes: Table<
        EpisodeRow,
        | 'id'
        | 'synopsis'
        | 'access'
        | 'status'
        | 'asset_id'
        | 'duration_seconds'
        | 'thumbnail_path'
        | 'created_at'
        | 'updated_at',
        [
          Rel<'episodes_season_id_fkey', ['season_id'], 'seasons'>,
          Rel<'episodes_asset_id_fkey', ['asset_id'], 'media_assets'>,
        ]
      >;
      viewer_profiles: Table<
        ViewerProfileRow,
        'id' | 'avatar' | 'color' | 'is_kids' | 'maturity_max' | 'is_default' | 'created_at' | 'updated_at'
      >;
      playback_progress: Table<
        PlaybackProgressRow,
        'episode_id' | 'position_seconds' | 'duration_seconds' | 'completed' | 'updated_at',
        [
          Rel<'playback_progress_profile_id_fkey', ['profile_id'], 'viewer_profiles'>,
          Rel<'playback_progress_title_id_fkey', ['title_id'], 'titles'>,
          Rel<'playback_progress_episode_id_fkey', ['episode_id'], 'episodes'>,
          Rel<'playback_progress_asset_id_fkey', ['asset_id'], 'media_assets'>,
        ]
      >;
      plans: Table<PlanRow, 'id' | 'currency' | 'max_streams' | 'active' | 'sort_order' | 'created_at'>;
      subscriptions: Table<
        SubscriptionRow,
        'id' | 'status' | 'current_period_start' | 'current_period_end' | 'created_at' | 'updated_at',
        [Rel<'subscriptions_plan_id_fkey', ['plan_id'], 'plans'>]
      >;
      payments: Table<
        PaymentRow,
        'id' | 'subscription_id' | 'provider_ref' | 'status' | 'raw' | 'paid_at' | 'created_at',
        [
          Rel<'payments_plan_id_fkey', ['plan_id'], 'plans'>,
          Rel<'payments_subscription_id_fkey', ['subscription_id'], 'subscriptions'>,
        ]
      >;
      playback_sessions: Table<
        PlaybackSessionRow,
        'id' | 'asset_id' | 'channel_id' | 'event_id' | 'profile_id' | 'country' | 'started_at' | 'last_heartbeat_at' | 'ended_at'
      >;
      live_events: Table<
        LiveEventRow,
        | 'id'
        | 'description'
        | 'poster_path'
        | 'access'
        | 'geo_allow'
        | 'published'
        | 'status'
        | 'scheduled_at'
        | 'started_at'
        | 'ended_at'
        | 'chat_enabled'
        | 'record'
        | 'replay_asset_id'
        | 'created_at'
        | 'updated_at',
        [Rel<'live_events_replay_asset_id_fkey', ['replay_asset_id'], 'media_assets'>]
      >;
      live_event_keys: Table<LiveEventKeyRow, 'rotated_at', [Rel<'live_event_keys_event_id_fkey', ['event_id'], 'live_events', true>]>;
      chat_messages: Table<
        ChatMessageRow,
        'id' | 'display_name' | 'created_at' | 'deleted_at' | 'deleted_by',
        [Rel<'chat_messages_event_id_fkey', ['event_id'], 'live_events'>]
      >;
      channels: Table<
        ChannelRow,
        | 'id'
        | 'logo_path'
        | 'status'
        | 'access'
        | 'active_source_id'
        | 'auto_disabled_reason'
        | 'sort_order'
        | 'epg_url'
        | 'epg_channel_id'
        | 'epg_updated_at'
        | 'created_at'
        | 'updated_at'
      >;
      epg_programs: Table<
        EpgProgramRow,
        'id' | 'description' | 'category' | 'rating' | 'external_id',
        [Rel<'epg_programs_channel_id_fkey', ['channel_id'], 'channels'>]
      >;
      channel_sources: Table<
        ChannelSourceRow,
        | 'id'
        | 'enabled'
        | 'health'
        | 'consecutive_failures'
        | 'consecutive_successes'
        | 'last_checked_at'
        | 'last_media_sequence'
        | 'last_sequence_change_at'
        | 'last_latency_ms'
        | 'last_bitrate_kbps'
        | 'last_error'
        | 'created_at'
        | 'updated_at',
        [Rel<'channel_sources_channel_id_fkey', ['channel_id'], 'channels'>]
      >;
      source_health_checks: Table<
        SourceHealthCheckRow,
        'id' | 'checked_at' | 'http_status' | 'latency_ms' | 'bitrate_kbps' | 'error',
        [Rel<'source_health_checks_source_id_fkey', ['source_id'], 'channel_sources'>]
      >;
      source_incidents: Table<
        SourceIncidentRow,
        'id' | 'source_id' | 'started_at' | 'resolved_at' | 'details',
        [
          Rel<'source_incidents_channel_id_fkey', ['channel_id'], 'channels'>,
          Rel<'source_incidents_source_id_fkey', ['source_id'], 'channel_sources'>,
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      search_titles: { Args: { q: string; max_results?: number }; Returns: TitleRow[] };
      active_subscription: { Args: { p_user_id: string }; Returns: SubscriptionRow };
      apply_successful_payment: { Args: { p_payment_id: string; p_raw?: Json }; Returns: SubscriptionRow };
      expire_subscriptions: { Args: Record<string, never>; Returns: number };
      authorize_live_publish: { Args: { p_path: string; p_key: string }; Returns: string | null };
      maturity_rank: { Args: { rating: string }; Returns: number };
      epg_now_next: {
        Args: { p_at?: string };
        Returns: { channel_id: string; now_title: I18nText | null; now_start: string | null; now_end: string | null; next_title: I18nText | null; next_start: string | null }[];
      };
      open_playback_session: {
        Args: {
          p_user_id: string;
          p_asset_id: string | null;
          p_channel_id: string | null;
          p_event_id: string | null;
          p_device_id: string;
          p_country: string | null;
          p_max_streams: number;
        };
        Returns: PlaybackSessionRow;
      };
    };
    Enums: {
      user_role: UserRole;
      access_level: AccessLevel;
      publish_status: PublishStatus;
      app_locale: AppLocale;
      asset_status: AssetStatus;
      job_status: JobStatus;
      title_kind: TitleKind;
      billing_interval: BillingInterval;
      subscription_status: SubscriptionStatus;
      payment_status: PaymentStatus;
      channel_status: ChannelStatus;
      source_kind: SourceKind;
      source_health: SourceHealth;
      incident_kind: IncidentKind;
      live_event_status: LiveEventStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
