-- Chouf — stream transcoding progress to the back-office (RLS still applies: admins only).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.media_assets, public.transcode_jobs;
  end if;
end;
$$;
