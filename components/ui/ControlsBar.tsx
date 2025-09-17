'use client';
import { useSceneStore } from '@/lib/scene';

export function ControlsBar() {
  const focus = useSceneStore(s => s.focusMode);
  const toggleFocus = useSceneStore(s => s.toggleFocus);
  const track = useSceneStore(s => s.track);
  const toggleTrack = useSceneStore(s => s.toggleTrack);
  const subtitles = useSceneStore(s => s.subtitles);
  const setSubtitles = useSceneStore(s => s.setSubtitles);
  const particleDensity = useSceneStore(s => s.particleDensity);
  const setParticleDensity = useSceneStore(s => s.setParticleDensity);

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-black/40 backdrop-blur border border-white/10">
        <div className="flex flex-wrap items-center gap-4 p-3 text-sm">
          <button onClick={toggleFocus} className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5">
            {focus ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <button onClick={toggleTrack} className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5">
            {track === 'day' ? 'Night' : 'Day'}
          </button>
          <label className="flex items-center gap-2">
            <input type="checkbox"
              checked={subtitles.transliteration}
              onChange={e => setSubtitles({ ...subtitles, transliteration: e.target.checked })}
            />
            Transliteration
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox"
              checked={subtitles.translation}
              onChange={e => setSubtitles({ ...subtitles, translation: e.target.checked })}
            />
            Translation
          </label>
          <label className="ml-auto flex items-center gap-2">
            Particles
            <input
              type="range"
              min={0} max={1.5} step={0.05}
              value={particleDensity}
              onChange={e => setParticleDensity(parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );
}