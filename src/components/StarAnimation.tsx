'use client';

import { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  emoji: string;
}

interface StarAnimationProps {
  show: boolean;
  count?: number;
}

const STAR_EMOJIS = ['⭐', '🌟', '✨', '💫', '🎉', '👏', '💪', '🎊'];

export default function StarAnimation({ show, count = 12 }: StarAnimationProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const newStars: Star[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10, // 10% - 90%
        y: Math.random() * 60 + 5,  // 5% - 65%
        size: Math.random() * 24 + 20, // 20-44px
        delay: Math.random() * 0.5,
        duration: Math.random() * 1 + 1.5, // 1.5-2.5s
        emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
      }));
      setStars(newStars);
      setVisible(true);

      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, count]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute animate-bounce"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            fontSize: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          {star.emoji}
        </span>
      ))}
    </div>
  );
}
