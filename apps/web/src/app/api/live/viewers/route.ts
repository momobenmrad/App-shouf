import { NextResponse } from 'next/server';
import { countViewers } from '@/server/viewers';

const UUID = /^[0-9a-f-]{36}$/;

/** Current viewer count of a channel or event (public, cached a few seconds). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel');
  const event = url.searchParams.get('event');
  const id = channel ?? event;
  if (!id || !UUID.test(id) || (channel && event)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const count = await countViewers(channel ? 'channel' : 'event', id);
  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'public, max-age=5' } });
}
