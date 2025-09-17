'use client';
import clsx from 'classnames';
import { useSceneStore } from '@/lib/scene';
import type { Track } from '@/lib/types';

export function ControlsBar() {
  const focus = useSceneStore(s => s.focusMode);
  const toggleFocus = useSceneStore(s => s.toggleFocus);
  const track = useSceneStore(s => s.track);
  const setTrack = useSceneStore(s => s.setTrack);
  const playlist = useSceneStore(s => s.playlist);
  const subtitles = useSceneStore(s => s.subtitles);
  const setSubtitles = useSceneStore(s => s.setSubtitles);
  const particleDensity = useSceneStore(s => s.particleDensity);
  const setParticleDensity = useSceneStore(s => s.setParticleDensity);

  const availableTracks = playlist?.tracks ?? [];
  const trackOptions = availableTracks.length
    ? availableTracks.map(option => ({ id: option.id, label: option.label }))
    : (['day', 'night'] satisfies Track[]).map(id => ({ id, label: id === 'day' ? 'Day' : 'Night' }));

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-black/40 backdrop-blur border border-white/10">
        <div className="flex flex-wrap items-center gap-4 p-3 text-sm">
          <button onClick={toggleFocus} className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5">
            {focus ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Scene</span>
            <div className="flex gap-2" role="group" aria-label="Scene selection">
              {trackOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => (availableTracks.length ? setTrack(option.id) : setTrack(option.id))}
                  className={clsx(
                    'rounded-xl border border-white/15 px-3 py-2 transition-colors',
                    track === option.id ? 'bg-white/20 text-white shadow-inner' : 'hover:bg-white/5 text-white/80',
                  )}
                  aria-pressed={track === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
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