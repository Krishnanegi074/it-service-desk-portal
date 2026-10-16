'use client';

import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Pulse = { a: Node; b: Node; t: number };

/** Slow "reasoning graph": nodes drift, nearby ones connect, small signals travel along edges. */
export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = getComputedStyle(cv);
    const tok = (n: string) => css.getPropertyValue(n).trim();
    const dot = tok('--dot') || '#8a9099';
    const acc = tok('--accent') || '#b55f00';
    const blue = tok('--p3') || '#2b69cc';
    const LINK = 130;
    let W = 0, H = 0, raf = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let mouse = { x: -999, y: -999 };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 11000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() < 0.12 ? 2.6 : 1.4
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      const edges: [Node, Node][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            edges.push([a, b]);
            const near = Math.max(0, 1 - Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y) / 220);
            ctx.globalAlpha = (1 - d / LINK) * (0.22 + near * 0.5);
            ctx.strokeStyle = near > 0.2 ? blue : dot;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.globalAlpha = n.r > 2 ? 0.55 : 0.4;
        ctx.fillStyle = dot;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
        if (!reduce) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -10) n.x = W + 10; if (n.x > W + 10) n.x = -10;
          if (n.y < -10) n.y = H + 10; if (n.y > H + 10) n.y = -10;
        }
      }
      if (!reduce && edges.length && Math.random() < 0.035 && pulses.length < 6) {
        const [a, b] = edges[(Math.random() * edges.length) | 0];
        pulses.push({ a, b, t: 0 });
      }
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.globalAlpha = Math.sin(p.t * Math.PI) * 0.9;
        ctx.fillStyle = acc;
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill();
        p.t += 0.012;
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onResize = () => { size(); if (reduce) frame(); };
    const host = cv.parentElement;
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse = { x: -999, y: -999 }; };

    size(); frame();
    window.addEventListener('resize', onResize);
    host?.addEventListener('pointermove', onMove);
    host?.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      host?.removeEventListener('pointermove', onMove);
      host?.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas id="field" ref={ref} aria-hidden="true" />;
}
