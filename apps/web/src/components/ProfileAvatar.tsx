export function ProfileAvatar({ avatar, color, size = 'md' }: { avatar: string; color: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-base' : size === 'lg' ? 'h-28 w-28 text-5xl' : 'h-16 w-16 text-3xl';
  return (
    <span className={`flex ${cls} items-center justify-center rounded-lg`} style={{ background: `hsl(${color} 55% 45%)` }} aria-hidden>
      {avatar}
    </span>
  );
}
