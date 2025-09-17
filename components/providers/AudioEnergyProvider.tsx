'use client';

import { useEffect } from 'react';
import { useSceneStore } from '@/lib/scene';

export function AudioEnergyProvider() {
  const audioEnabled = useSceneStore(s => s.audio.enabled);
  const sampleEnergy = useSceneStore(s => s.sampleAudioEnergy);

  useEffect(() => {
    let raf = 0;
    const cancel = () => {
      if (raf) cancelAnimationFrame(raf);
    };

    if (!audioEnabled) {
      sampleEnergy();
      return cancel;
    }

    const tick = () => {
      sampleEnergy();
      raf = requestAnimationFrame(tick);
    };

    tick();

    return cancel;
  }, [audioEnabled, sampleEnergy]);

  return null;
}
