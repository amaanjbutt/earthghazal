'use client';
import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/scene';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const computeDensityScale = (width: number) => {
  if (width < 640) return 0.4;
  if (width < 1024) return 0.7;
  return 1;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
};

type Props = { dimmed?: boolean };

export function WeightlessParticles({ dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const energy = useSceneStore(s => s.energy);
  const density = useSceneStore(s => s.particleDensity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = mediaQuery.matches;
    let hidden = document.hidden;
    const wind = { x: 0, y: 0 };
    const targetWind = { x: 0, y: 0 };
    let lastPointerUpdate = 0;
    let lastOrientationUpdate = 0;
    const canUseDeviceOrientation = 'DeviceOrientationEvent' in window;

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const drawParticleField = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = dimmed ? 0.2 : 0.5;
      ctx.fillStyle = 'white';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      if (reduceMotion || hidden) {
        raf = 0;
        return;
      }

      const energyLevel = clamp(energy(), 0, 1);
      const driftStrength = 0.0015 + energyLevel * 0.0045;
      const maxSpeed = 0.04 + energyLevel * 0.06;

      targetWind.x *= 0.97;
      targetWind.y *= 0.97;
      wind.x += (targetWind.x - wind.x) * 0.04;
      wind.y += (targetWind.y - wind.y) * 0.04;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = dimmed ? 0.2 : 0.5;
      ctx.fillStyle = 'white';

      for (const p of particles) {
        p.vx += Math.sin(p.life * 0.003) * driftStrength + wind.x * 0.1;
        p.vy += Math.cos(p.life * 0.004) * driftStrength + wind.y * 0.1;
        p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
        p.vy = clamp(p.vy, -maxSpeed, maxSpeed);
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        if (p.x < 0) p.x += canvas.width;
        if (p.x > canvas.width) p.x -= canvas.width;
        if (p.y < 0) p.y += canvas.height;
        if (p.y > canvas.height) p.y -= canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (!raf && !reduceMotion && !hidden) {
        raf = requestAnimationFrame(step);
      }
    };

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const densityScale = computeDensityScale(w);
      const focusScale = dimmed ? 0.35 : 1;
      const baseCount = Math.max(
        12,
        Math.floor(((w * h) / 12000) * density * densityScale * focusScale),
      );
      const targetCount = reduceMotion
        ? Math.max(6, Math.floor(baseCount * 0.35))
        : baseCount;

      wind.x = 0;
      wind.y = 0;
      targetWind.x = 0;
      targetWind.y = 0;

      particles = Array.from({ length: targetCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.04 * DPR,
        vy: (Math.random() - 0.5) * 0.04 * DPR,
        r: (Math.random() * 1.6 + 0.4) * DPR,
        life: Math.random() * 1000,
      }));

      if (reduceMotion) {
        drawParticleField();
      }
    };

    const handleVisibilityChange = () => {
      hidden = document.hidden;
      if (hidden) {
        stop();
      } else if (!reduceMotion) {
        start();
      }
    };

    const updateMotionPreference = (event?: MediaQueryListEvent) => {
      reduceMotion = event?.matches ?? mediaQuery.matches;
      if (reduceMotion) {
        stop();
      } else if (!hidden) {
        start();
      }
      resize();
    };

    const pointerHandler = (event: PointerEvent) => {
      if (reduceMotion) return;
      const now = performance.now();
      if (now - lastPointerUpdate < 140) return;
      lastPointerUpdate = now;

      const relativeX = event.clientX / window.innerWidth - 0.5;
      const relativeY = event.clientY / window.innerHeight - 0.5;
      targetWind.x = clamp(relativeX * 0.04, -0.05, 0.05);
      targetWind.y = clamp(relativeY * 0.04, -0.05, 0.05);
    };

    const orientationHandler = (event: DeviceOrientationEvent) => {
      if (reduceMotion) return;
      const now = performance.now();
      if (now - lastOrientationUpdate < 200) return;
      lastOrientationUpdate = now;

      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      targetWind.x = clamp((gamma / 45) * 0.02, -0.04, 0.04);
      targetWind.y = clamp((beta / 45) * 0.02, -0.04, 0.04);
    };

    resize();
    if (reduceMotion) {
      drawParticleField();
    } else {
      start();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointerHandler, { passive: true });
    if (canUseDeviceOrientation) {
      window.addEventListener('deviceorientation', orientationHandler);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const removeMotionListener = typeof mediaQuery.addEventListener === 'function'
      ? (() => {
          mediaQuery.addEventListener('change', updateMotionPreference);
          return () => mediaQuery.removeEventListener('change', updateMotionPreference);
        })()
      : (() => {
          mediaQuery.addListener(updateMotionPreference);
          return () => mediaQuery.removeListener(updateMotionPreference);
        })();

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointerHandler);
      if (canUseDeviceOrientation) {
        window.removeEventListener('deviceorientation', orientationHandler);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      removeMotionListener();
    };
  }, [dimmed, density, energy]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10" />;
}
