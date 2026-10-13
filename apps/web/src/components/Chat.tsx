'use client';

import type { ChatMessageRow } from '@chouf/shared';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

type Message = Pick<ChatMessageRow, 'id' | 'display_name' | 'body' | 'created_at' | 'user_id'>;

export function Chat({ eventId, initial, userId, isAdmin, supabaseUrl, supabaseAnonKey }: { eventId: string; initial: Message[]; userId: string | null; isAdmin: boolean; supabaseUrl: string; supabaseAnonKey: string }) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel(`chat-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `event_id=eq.${eventId}` }, (payload) => {
        const row = payload.new as Message;
        setMessages((list) => (list.some((m) => m.id === row.id) ? list : [...list.slice(-199), row]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `event_id=eq.${eventId}` }, (payload) => {
        const row = payload.new as ChatMessageRow;
        if (row.deleted_at) setMessages((list) => list.filter((m) => m.id !== row.id));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || !userId) return;
    setSending(true);
    setError(null);
    const supabase = getBrowserSupabase(supabaseUrl, supabaseAnonKey);
    const { error: err } = await supabase.from('chat_messages').insert({ event_id: eventId, user_id: userId, body });
    setSending(false);
    if (err) {
      setError(err.code === 'CH002' ? t('tooFast') : err.code === '42501' ? t('closed') : t('failed'));
      return;
    }
    setDraft('');
  }

  async function remove(id: number) {
    const supabase = getBrowserSupabase(supabaseUrl, supabaseAnonKey);
    await supabase.from('chat_messages').update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq('id', id);
    setMessages((list) => list.filter((m) => m.id !== id));
  }

  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <section className="flex h-[60vh] flex-col rounded-lg border border-line bg-panel sm:h-auto sm:min-h-[420px]">
      <h2 className="border-b border-line px-4 py-2 text-sm font-semibold">{t('title')}</h2>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && <p className="text-muted">{t('empty')}</p>}
        {messages.map((m) => (
          <div key={m.id} className="group flex gap-2">
            <span className="shrink-0 text-xs text-muted">{time.format(new Date(m.created_at))}</span>
            <span className="min-w-0 flex-1 break-words">
              <span className={`font-semibold ${m.user_id === userId ? 'text-brand' : 'text-white/90'}`}>{m.display_name}</span> <span className="text-white/80">{m.body}</span>
            </span>
            {isAdmin && (
              <button onClick={() => remove(m.id)} title={t('delete')} className="hidden text-xs text-red-400 group-hover:block">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-line p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
          disabled={!userId || sending}
          placeholder={userId ? t('placeholder') : t('loginToChat')}
          className="min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button disabled={!userId || sending || !draft.trim()} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
          {t('send')}
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
