'use client';

import { MATURITY_ORDER, type ViewerProfileRow } from '@chouf/shared';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import type { ActionState } from '@/server/actions/admin';
import { saveProfileAction } from '@/server/actions/profiles';
import { ProfileAvatar } from './ProfileAvatar';

const AVATARS = ['🙂', '😎', '🦁', '🐱', '🐼', '🦊', '🐸', '🦄', '🌙', '⭐', '🎬', '⚽'];
const COLORS = [0, 30, 60, 120, 180, 210, 260, 300, 330];

export function ProfileForm({ profile, locale }: { profile?: ViewerProfileRow; locale: string }) {
  const t = useTranslations('profiles');
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfileAction, {});
  const [avatar, setAvatar] = useState(profile?.avatar ?? '🙂');
  const [color, setColor] = useState(profile?.color ?? 210);
  const [kids, setKids] = useState(profile?.is_kids ?? false);

  return (
    <form action={action} className="space-y-5 rounded-lg border border-line bg-panel p-5">
      {profile && <input type="hidden" name="id" value={profile.id} />}
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="avatar" value={avatar} />
      <input type="hidden" name="color" value={color} />
      <div className="flex items-start gap-5">
        <ProfileAvatar avatar={avatar} color={color} size="lg" />
        <div className="flex-1 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t('name')}</span>
            <input name="name" defaultValue={profile?.name} required maxLength={30} className="w-full rounded-md border border-line bg-ink px-3 py-2 outline-none focus:border-brand" />
          </label>
          <div className="flex flex-wrap gap-1">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)} className={`h-9 w-9 rounded text-xl ${a === avatar ? 'bg-white/20 ring-1 ring-white' : 'hover:bg-white/10'}`}>{a}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`hue ${c}`} className={`h-6 w-6 rounded-full ${c === color ? 'ring-2 ring-white' : ''}`} style={{ background: `hsl(${c} 55% 45%)` }} />
            ))}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_kids" checked={kids} onChange={(e) => setKids(e.target.checked)} /> {t('kidsProfile')}
      </label>
      {!kids && (
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">{t('maturity')}</span>
          <select name="maturity_max" defaultValue={profile?.maturity_max ?? '18+'} className="rounded-md border border-line bg-ink px-3 py-2">
            {MATURITY_ORDER.map((r) => (
              <option key={r} value={r}>{r === 'all' ? t('allAges') : r}</option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-center gap-4">
        <button disabled={pending} className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark disabled:opacity-60">{t('save')}</button>
        {state.error && <span className="text-sm text-red-400">{state.error === 'limit' ? t('limit') : state.error}</span>}
      </div>
    </form>
  );
}
