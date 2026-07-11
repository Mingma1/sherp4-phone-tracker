import { useMemo } from 'react';

/**
 * Falling cherry-blossom petals — pure CSS, GPU-friendly, no deps.
 * Renders a fixed, pointer-events-none layer behind content.
 */
export default function SakuraPetals({ count = 14 }: { count?: number }) {
  const petals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * -18;
      const duration = 11 + Math.random() * 12;
      const size = 10 + Math.random() * 12;
      const drift = (Math.random() - 0.5) * 140;
      const rotate = Math.random() * 360;
      const hue = Math.random() > 0.5 ? '#ffd9ec' : '#ffb6d5';
      return { id: i, left, delay, duration, size, drift, rotate, hue };
    });
  }, [count]);

  return (
    <div className="sakura-layer" aria-hidden>
      {petals.map(p => (
        <span
          key={p.id}
          className="sakura-petal"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.hue,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as any]: `${p.drift}px`,
            ['--spin' as any]: `${p.rotate + 360}deg`,
          }}
        />
      ))}
    </div>
  );
}
