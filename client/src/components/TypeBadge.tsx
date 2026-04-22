// Pastel backgrounds per type, tuned for dark text.
const TYPE_SOFT_BG: Record<string, string> = {
  normal:   '#f0ede6',
  fire:     '#ffe8d0',
  water:    '#d8ecff',
  electric: '#fff7c2',
  grass:    '#d8f5d8',
  ice:      '#cdf4f3',
  fighting: '#ffd8d8',
  poison:   '#eed8f5',
  ground:   '#f5e8c0',
  flying:   '#e8e0fc',
  psychic:  '#ffd8eb',
  bug:      '#e8f5cc',
  rock:     '#f0e8c0',
  ghost:    '#dcd0f0',
  dragon:   '#ddd0fc',
  dark:     '#e0d8d2',
  steel:    '#e4e8f0',
  fairy:    '#fce0ef',
};

interface Props {
  type: string;
  size?: 'xs' | 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
  as?: 'span' | 'button';
}

export function TypeBadge({ type, size = 'md', selected, onClick, as = 'span' }: Props) {
  const bg = TYPE_SOFT_BG[type.toLowerCase()] ?? '#f0ede6';
  const sizeClass =
    size === 'xs' ? 'px-1 py-px text-[8px]' :
    size === 'sm' ? 'px-2 py-0.5 text-[12px]' :
    'px-2.5 py-1 text-xs';
  const ringClass = selected ? 'ring-2 ring-offset-2 ring-action' : '';
  const Cmp = as;
  const interactive = as === 'button';
  return (
    <Cmp
      onClick={onClick}
      type={interactive ? 'button' : undefined}
      style={{ background: bg }}
      className={[
        'inline-flex items-center justify-center rounded-full uppercase tracking-wider text-black/70 shadow-[2px_2px_0px_rgba(0,0,0,0.25)]',
        'pixel-text',
        sizeClass,
        ringClass,
        interactive ? 'transition hover:scale-[1.03] focus-ring' : '',
      ].join(' ')}
      aria-pressed={interactive ? Boolean(selected) : undefined}
    >
      {type}
    </Cmp>
  );
}
