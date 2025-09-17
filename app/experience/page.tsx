'use client';
import { Suspense, useEffect } from 'react';
import { EarthWindow } from '@/components/video/EarthWindow';
import { WeightlessParticles } from '@/components/canvas/WeightlessParticles';
import { VerseCycler } from '@/components/poetry/VerseCycler';
import { ControlsBar } from '@/components/ui/ControlsBar';
import { IntroOverlay } from '@/components/ui/IntroOverlay';
import { useSceneStore } from '@/lib/scene';

export default function ExperiencePage() {
  const focusMode = useSceneStore(s => s.focusMode);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useSceneStore.getState();
      if (!state.audioReady) return;
      if (e.code === 'KeyF') state.toggleFocus();
      if (e.code === 'KeyT') state.toggleTrack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      <EarthWindow />
      <IntroOverlay />
      <WeightlessParticles dimmed={focusMode} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 video-gradient">
        <Suspense fallback={null}>
          <VerseCycler />
        </Suspense>
      </div>
      <ControlsBar />
    </main>
  );
}