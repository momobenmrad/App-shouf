-- Phase 2: live events, stream keys, chat, live sessions.
begin;

create schema tests;
create function tests.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end;
$$;
create function tests.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid::text, true);
$$;
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@chouf.test', '{}'),
  ('00000000-0000-0000-0000-00000000000b', 'viewer@chouf.test', '{"display_name":"Samir"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';

insert into public.live_events (id, slug, name, published, status, stream_path, access) values
  ('50000000-0000-0000-0000-000000000001', 'finale', '{"fr":"Finale"}', true, 'live', 'live/finale', 'free'),
  ('50000000-0000-0000-0000-000000000002', 'secret', '{"fr":"Brouillon"}', false, 'scheduled', 'live/secret', 'free');
insert into public.live_event_keys (event_id, key_hash) values
  ('50000000-0000-0000-0000-000000000001', encode(sha256(convert_to('k-finale', 'utf8')), 'hex'));

-- Stream key authorisation (service role) ------------------------------------------------------
set local role service_role;
select tests.ok(public.authorize_live_publish('live/finale', 'k-finale') = '50000000-0000-0000-0000-000000000001', 'valid stream key is accepted');
select tests.ok(public.authorize_live_publish('live/finale', 'wrong') is null, 'wrong stream key is refused');
select tests.ok(public.authorize_live_publish('live/other', 'k-finale') is null, 'key is bound to its path');
update public.live_events set status = 'ended' where slug = 'finale';
select tests.ok(public.authorize_live_publish('live/finale', 'k-finale') is null, 'ended events refuse publishing');
update public.live_events set status = 'live' where slug = 'finale';
reset role;

-- Viewer ----------------------------------------------------------------------------------------
set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.ok((select count(*) = 1 from public.live_events), 'viewer sees only published events');
do $$
begin
  perform 1 from public.live_event_keys;
  raise exception 'FAILED: viewer read stream keys';
exception when insufficient_privilege then raise notice 'ok - viewer cannot read stream keys';
end;
$$;
do $$
begin
  perform public.authorize_live_publish('live/finale', 'k-finale');
  raise exception 'FAILED: viewer called authorize_live_publish';
exception when insufficient_privilege then raise notice 'ok - viewer cannot call authorize_live_publish';
end;
$$;

insert into public.chat_messages (event_id, user_id, body) values ('50000000-0000-0000-0000-000000000001', auth.uid(), '  Salam !  ');
select tests.ok((select body = 'Salam !' and display_name = 'Samir' from public.chat_messages), 'chat message is trimmed and stamped with the display name');

do $$
begin
  insert into public.chat_messages (event_id, user_id, body) values ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'spoof');
  raise exception 'FAILED: viewer posted as someone else';
exception when insufficient_privilege then raise notice 'ok - viewer cannot post as another user';
end;
$$;
do $$
begin
  insert into public.chat_messages (event_id, user_id, body) values ('50000000-0000-0000-0000-000000000002', auth.uid(), 'hello');
  raise exception 'FAILED: viewer posted on an unpublished event';
exception when insufficient_privilege then raise notice 'ok - viewer cannot post on unpublished events';
end;
$$;
do $$
begin
  insert into public.chat_messages (event_id, user_id, body, display_name) values ('50000000-0000-0000-0000-000000000001', auth.uid(), 'x', 'Admin');
  raise exception 'FAILED: viewer set display_name';
exception when insufficient_privilege then raise notice 'ok - viewer cannot choose a display name';
end;
$$;
insert into public.chat_messages (event_id, user_id, body)
  select '50000000-0000-0000-0000-000000000001', auth.uid(), 'msg ' || i from generate_series(1, 4) i;
do $$
begin
  insert into public.chat_messages (event_id, user_id, body) values ('50000000-0000-0000-0000-000000000001', auth.uid(), 'too fast');
  raise exception 'FAILED: rate limit not enforced';
exception when sqlstate 'CH002' then raise notice 'ok - chat is rate limited to 5 messages per 10 s';
end;
$$;
reset role;

-- Admin moderation ------------------------------------------------------------------------------
set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
update public.chat_messages set deleted_at = now(), deleted_by = auth.uid() where body = 'Salam !';
select tests.ok((select count(*) = 5 from public.chat_messages), 'admin still sees deleted messages');
select tests.ok((select count(*) = 2 from public.live_events), 'admin sees unpublished events');
reset role;

set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.ok((select count(*) = 4 from public.chat_messages), 'deleted messages disappear for viewers');
reset role;

-- Live sessions ---------------------------------------------------------------------------------
set local role service_role;
select public.open_playback_session('00000000-0000-0000-0000-00000000000b', null, null, '50000000-0000-0000-0000-000000000001', 'device-aaaa', 'TN', 2);
select tests.ok((select event_id is not null from public.playback_sessions where device_id = 'device-aaaa'), 'live event sessions are recorded');
do $$
begin
  insert into public.playback_sessions (user_id, device_id) values ('00000000-0000-0000-0000-00000000000b', 'device-zzzz');
  raise exception 'FAILED: targetless session accepted';
exception when check_violation then raise notice 'ok - a session targets exactly one asset, channel or event';
end;
$$;
reset role;

rollback;
