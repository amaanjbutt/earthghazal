'use client';
import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/scene';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const computeDensityScale = (width: number) => {
  if (width < 640) return 0.4;
  if (width < 1024) return 0.7;
  return 1;
};

type Props = { dimmed?: boolean };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
};

export function WeightlessParticles({ dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const energy = useSceneStore(s => s.energy);
  const density = useSceneStore(s => s.particleDensity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = mediaQuery.matches;
    let hidden = document.hidden;
    const wind = { x: 0, y: 0 };
    const targetWind = { x: 0, y: 0 };
    let lastPointerUpdate = 0;
    let lastOrientationUpdate = 0;
    const canUseDeviceOrientation = 'DeviceOrientationEvent' in window;

    const drawFrame = (staticRender: boolean) => {
      const energyLevel = clamp(energy(), 0, 1);
      const driftStrength = 0.0015 + energyLevel * 0.0045;
      const maxSpeed = 0.04 + energyLevel * 0.06;

      if (!staticRender) {
        targetWind.x *= 0.97;
        targetWind.y *= 0.97;
        wind.x += (targetWind.x - wind.x) * 0.04;
        wind.y += (targetWind.y - wind.y) * 0.04;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = dimmed ? 0.2 : 0.5;
      ctx.fillStyle = 'white';

      for (const particle of particles) {
        if (!staticRender) {
          particle.vx += Math.sin(particle.life * 0.003) * driftStrength + wind.x * 0.1;
          particle.vy += Math.cos(particle.life * 0.004) * driftStrength + wind.y * 0.1;
          particle.vx = clamp(particle.vx, -maxSpeed, maxSpeed);
          particle.vy = clamp(particle.vy, -maxSpeed, maxSpeed);
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life += 1;

          if (particle.x < 0) particle.x += canvas.width;
          if (particle.x > canvas.width) particle.x -= canvas.width;
          if (particle.y < 0) particle.y += canvas.height;
          if (particle.y > canvas.height) particle.y -= canvas.height;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const cancel = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = () => {
      if (reduceMotion || hidden) {
        raf = 0;
        return;
      }

      drawFrame(false);
      raf = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!raf && !reduceMotion && !hidden) {
        raf = requestAnimationFrame(tick);
      }
    };

    const rebuildParticles = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const densityScale = computeDensityScale(w);
      const areaFactor = (w * h) / 12000;
      const focusScale = dimmed ? 0.35 : 1;
      const baseCount = Math.max(12, Math.floor(areaFactor * density * densityScale * focusScale));
      const count = reduceMotion ? Math.max(6, Math.floor(baseCount * 0.35)) : baseCount;

      wind.x = 0;
      wind.y = 0;
      targetWind.x = 0;
      targetWind.y = 0;

      particles = Array.from({ length: count }, (): Particle => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.04 * DPR,
        vy: (Math.random() - 0.5) * 0.04 * DPR,
        r: Math.random() * 1.6 * DPR,
        life: Math.random() * 1000
      }));

      if (reduceMotion || hidden) {
        drawFrame(true);
      }
    };

    const handleVisibilityChange = () => {
      hidden = document.hidden;
      if (hidden) {
        cancel();
      } else if (!reduceMotion) {
        drawFrame(false);
        schedule();
      }
    };

    const updateMotionPreference = (event?: MediaQueryListEvent) => {
      reduceMotion = event?.matches ?? mediaQuery.matches;
      cancel();
      rebuildParticles();
      if (reduceMotion) {
        drawFrame(true);
      } else if (!hidden) {
        schedule();
      }
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

    rebuildParticles();
    if (reduceMotion || hidden) {
      drawFrame(true);
    } else {
      schedule();
    }

    window.addEventListener('resize', rebuildParticles);
    window.addEventListener('pointermove', pointerHandler);
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
      cancel();
      window.removeEventListener('resize', rebuildParticles);
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
