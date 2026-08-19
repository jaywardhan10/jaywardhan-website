import { useEffect, useRef } from 'react';

const BLOBS = [
  { className: 'blob blob-1', speed: 0.15 },
  { className: 'blob blob-2', speed: 0.3 },
  { className: 'blob blob-3', speed: 0.08 },
];

export default function ParallaxBlobs() {
  const refs = useRef([]);

  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let ticking = false;
    function update() {
      const y = window.scrollY;
      refs.current.forEach((node, i) => {
        if (!node) return;
        node.style.transform = `translate3d(0, ${y * BLOBS[i].speed}px, 0)`;
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hero-blobs" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <span key={b.className} ref={(el) => (refs.current[i] = el)} className={b.className} />
      ))}
    </div>
  );
}
