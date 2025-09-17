'use client';

import { useEffect } from 'react';
import { useSceneStore } from '@/lib/scene';

export function AudioEnergyProvider() {
  const audioActive = useSceneStore(s => s.audioPlaying && !s.audioMuted);
  const energy = useSceneStore(s => s.energy);

  useEffect(() => {
    if (!audioActive) {
      energy();
      return;
    }

    let raf = 0;
    const tick = () => {
      energy();
      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [audioActive, energy]);

  return null;
}
