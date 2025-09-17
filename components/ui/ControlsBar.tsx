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
  const audioReady = useSceneStore(s => s.audioReady);
  const audioPlaying = useSceneStore(s => s.audioPlaying);
  const playAudio = useSceneStore(s => s.playAudio);
  const pauseAudio = useSceneStore(s => s.pauseAudio);
  const audioMuted = useSceneStore(s => s.audioMuted);
  const toggleMute = useSceneStore(s => s.toggleMute);
  const audioVolume = useSceneStore(s => s.audioVolume);
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
          focus && 'pointer-events-none translate-y-6 opacity-0'
        )}
      >
        <div className="flex flex-wrap items-center gap-3 p-3">
          <button
            onClick={toggleFocus}
            aria-pressed={focus}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >

    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-black/40 backdrop-blur border border-white/10">
        <div className="flex flex-wrap items-center gap-4 p-3 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={audioPlaying ? pauseAudio : playAudio}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              {audioPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={toggleMute}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              {audioMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <label className="flex items-center gap-2 whitespace-nowrap">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={e => setAudioVolume(parseFloat(e.target.value))}
              disabled={!audioReady}
              className="w-28 accent-white/90 disabled:opacity-40"
            />
          </label>
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
          <button
            onClick={toggleTrack}

            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"

            disabled={!audioReady}
            className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"

          >
            {track === 'day' ? 'Night' : 'Day'}
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.transliteration}
              onChange={e => setSubtitles({ ...subtitles, transliteration: e.target.checked })}
              className="accent-white"
            />
            Transliteration
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.translation}
              onChange={e => setSubtitles({ ...subtitles, translation: e.target.checked })}
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
              onChange={e => setParticleDensity(parseFloat(e.target.value))}
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