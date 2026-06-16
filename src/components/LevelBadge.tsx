import { Level, LEVEL_NAMES } from '@/types';

const LEVEL_COLORS: Record<Level, { bg: string; text: string; emoji: string }> = {
  1: { bg: 'bg-green-100', text: 'text-green-700', emoji: '🌱' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '🌿' },
  3: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🌳' },
  4: { bg: 'bg-blue-100', text: 'text-blue-700', emoji: '🚀' },
  5: { bg: 'bg-purple-100', text: 'text-purple-700', emoji: '⭐' },
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'md' | 'lg';
}

export default function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const colors = LEVEL_COLORS[level];
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-lg gap-3',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
    >
      <span className="text-xl">{colors.emoji}</span>
      <span>等级 {level}</span>
      <span className="opacity-75">· {LEVEL_NAMES[level]}</span>
    </span>
  );
}
