'use client';
import { Suspense, useEffect } from 'react';
import { EarthWindow } from '@/components/video/EarthWindow';
import { WeightlessParticles } from '@/components/canvas/WeightlessParticles';
import { VerseCycler } from '@/components/poetry/VerseCycler';
import { ControlsBar } from '@/components/ui/ControlsBar';
import { AudioEnergyProvider } from '@/components/providers/AudioEnergyProvider';
import { useSceneStore } from '@/lib/scene';

export default function ExperiencePage() {
  const focusMode = useSceneStore(s => s.focusMode);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') useSceneStore.getState().toggleFocus();
      if (e.code === 'KeyT') useSceneStore.getState().toggleTrack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      <AudioEnergyProvider />
      <EarthWindow />
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