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
  const toggleTrack = useSceneStore(s => s.toggleTrack);
  const audioReady = useSceneStore(s => s.audio.ready);
  const audioPlaying = useSceneStore(s => s.audio.playing);
  const playAudio = useSceneStore(s => s.playAudio);
  const pauseAudio = useSceneStore(s => s.pauseAudio);
  const audioMuted = useSceneStore(s => s.audio.muted);
  const toggleAudioMute = useSceneStore(s => s.toggleAudioMute);
  const audioVolume = useSceneStore(s => s.audio.volume);
  const setAudioVolume = useSceneStore(s => s.setAudioVolume);
  const subtitles = useSceneStore(s => s.subtitles);
  const setSubtitles = useSceneStore(s => s.setSubtitles);
  const particleDensity = useSceneStore(s => s.particleDensity);
  const setParticleDensity = useSceneStore(s => s.setParticleDensity);
  const toggleInfoDialog = useSceneStore(s => s.toggleInfoDialog);

  const availableTracks = playlist?.tracks ?? [];
  const trackOptions = availableTracks.length
    ? availableTracks.map(option => ({ id: option.id, label: option.label }))
    : (['day', 'night'] satisfies Track[]).map(id => ({ id, label: id === 'day' ? 'Day' : 'Night' }));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div
        className={clsx(
          'pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-black/60 text-sm text-white shadow-lg backdrop-blur transition-all duration-300',
          focus && 'pointer-events-none translate-y-6 opacity-0',
        )}
      >
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={audioPlaying ? pauseAudio : playAudio}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {audioPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={toggleAudioMute}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {audioMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <label className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-white/15 px-3 py-2">
            <span className="text-white/70">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={event => setAudioVolume(parseFloat(event.target.value))}
              disabled={!audioReady}
              className="w-28 accent-white/90 disabled:opacity-40"
            />
          </label>
          <button
            onClick={toggleFocus}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            {focus ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2">
            <span className="text-white/60">Scene</span>
            <div className="flex gap-2" role="group" aria-label="Scene selection">
              {trackOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTrack(option.id)}
                  className={clsx(
                    'rounded-xl border border-white/15 px-3 py-2 transition',
                    track === option.id ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )}
                  aria-pressed={track === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={toggleTrack}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Switch Scene
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.transliteration}
              onChange={event => setSubtitles({ ...subtitles, transliteration: event.target.checked })}
              className="accent-white"
            />
            Transliteration
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.translation}
              onChange={event => setSubtitles({ ...subtitles, translation: event.target.checked })}
              className="accent-white"
            />
            Translation
          </label>
          <label className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <span>Particles</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={particleDensity}
              onChange={event => setParticleDensity(parseFloat(event.target.value))}
              className="h-2 w-28 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
            />
          </label>
          <button
            onClick={toggleInfoDialog}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Info
          </button>
        </div>
      </div>
      {focus && (
        <div className="pointer-events-auto mt-2 flex justify-center">
          <button
            onClick={toggleFocus}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-medium text-white/80 shadow backdrop-blur transition hover:bg-white/20 hover:text-white"
            aria-label="Exit focus mode and show controls"
            style={{ opacity: 'var(--input-cue-opacity, 1)' }}
          >
            Show controls
          </button>
        </div>
      )}
    </div>
  );
}
