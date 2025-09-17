'use client';

import { useEffect } from 'react';
import { useSceneStore } from '@/lib/scene';

export function AudioEnergyProvider() {
  const audioPlaying = useSceneStore(s => s.audio.playing);
  const sampleEnergy = useSceneStore(s => s.sampleAudioEnergy);

  useEffect(() => {
    let raf = 0;
    const cancel = () => {
      if (raf) cancelAnimationFrame(raf);
    };

    if (!audioPlaying) {
      sampleEnergy();
      return cancel;
    }

    const tick = () => {
      sampleEnergy();
      raf = requestAnimationFrame(tick);
    };

    tick();

    return cancel;
  }, [audioPlaying, sampleEnergy]);

  return null;
}
