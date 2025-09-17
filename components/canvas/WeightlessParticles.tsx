'use client';
import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/scene';

type Props = { dimmed?: boolean };

export function WeightlessParticles({ dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const energy = useSceneStore(s => s.energy);
  const density = useSceneStore(s => s.particleDensity);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; life: number }[] = [];
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      particles = Array.from({ length: Math.floor((w * h) / 12000 * density) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.08 * DPR,
        vy: (Math.random() - 0.5) * 0.08 * DPR,
        r: Math.random() * 1.6 * DPR,
        life: Math.random() * 1000
      }));
    }
    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = dimmed ? 0.2 : 0.5;
      ctx.fillStyle = 'white';
      const nudge = (0.05 + energy() * 0.15);
      for (const p of particles) {
        p.vx += Math.sin(p.life * 0.003) * 0.005 * nudge;
        p.vy += Math.cos(p.life * 0.004) * 0.005 * nudge;
        p.x += p.vx; p.y += p.vy; p.life += 1;
        if (p.x < 0) p.x += canvas.width; if (p.x > canvas.width) p.x -= canvas.width;
        if (p.y < 0) p.y += canvas.height; if (p.y > canvas.height) p.y -= canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }
    resize();
    step();
    window.addEventListener('resize', resize);
    function handleVisibilityChange() {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(step);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dimmed, density, energy]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10" />;
}
