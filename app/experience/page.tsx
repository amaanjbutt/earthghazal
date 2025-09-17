'use client';
import { Suspense, useEffect } from 'react';
import { EarthWindow } from '@/components/video/EarthWindow';
import { WeightlessParticles } from '@/components/canvas/WeightlessParticles';
import { VerseCycler } from '@/components/poetry/VerseCycler';
import { ControlsBar } from '@/components/ui/ControlsBar';
import { AudioEnergyProvider } from '@/components/providers/AudioEnergyProvider';
import { InfoDialog } from '@/components/ui/InfoDialog';
import { IntroOverlay } from '@/components/ui/IntroOverlay';
import { useSceneStore } from '@/lib/scene';

export default function ExperiencePage() {
  const focusMode = useSceneStore(s => s.focusMode);
  const infoDialogOpen = useSceneStore(s => s.infoDialogOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        useSceneStore.getState().toggleFocus();
      }
      if (key === 't') {
        e.preventDefault();
        useSceneStore.getState().toggleTrack();
      }
      if (key === 'i') {
        e.preventDefault();
        const { infoDialogOpen: open, setInfoDialogOpen } = useSceneStore.getState();
        setInfoDialogOpen(!open);
      }
      const state = useSceneStore.getState();
      if (!state.audioReady) return;
      if (e.code === 'KeyF') state.toggleFocus();
      if (e.code === 'KeyT') state.toggleTrack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('focus-cursor-dim', focusMode && !infoDialogOpen);
    document.body.style.setProperty('--input-cue-opacity', focusMode ? '0.35' : '1');
    return () => {
      document.body.classList.remove('focus-cursor-dim');
      document.body.style.removeProperty('--input-cue-opacity');
    };
  }, [focusMode, infoDialogOpen]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      <AudioEnergyProvider />
      <EarthWindow />
      <IntroOverlay />
      <WeightlessParticles dimmed={focusMode} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 video-gradient">
        <Suspense fallback={null}>
          <VerseCycler />
        </Suspense>
      </div>
      <ControlsBar />
      <InfoDialog />
    </main>
  );
}