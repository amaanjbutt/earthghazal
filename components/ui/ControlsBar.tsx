'use client';

import clsx from 'classnames';

import { useSceneStore } from '@/lib/scene';
import type { Track } from '@/lib/types';

export function ControlsBar() {
  const {
    focusMode,
    toggleFocus,
    track,
    setTrack,
    playlist,
    audioReady,
    audioPlaying,
    playAudio,
    pauseAudio,
    audioMuted,
    toggleMute,
    audioVolume,
    setAudioVolume,
    subtitles,
    setSubtitles,
    particleDensity,
    setParticleDensity,
    toggleInfoDialog,
  } = useSceneStore(state => ({
    focusMode: state.focusMode,
    toggleFocus: state.toggleFocus,
    track: state.track,
    setTrack: state.setTrack,
    playlist: state.playlist,
    audioReady: state.audioReady,
    audioPlaying: state.audioPlaying,
    playAudio: state.playAudio,
    pauseAudio: state.pauseAudio,
    audioMuted: state.audioMuted,
    toggleMute: state.toggleMute,
    audioVolume: state.audioVolume,
    setAudioVolume: state.setAudioVolume,
    subtitles: state.subtitles,
    setSubtitles: state.setSubtitles,
    particleDensity: state.particleDensity,
    setParticleDensity: state.setParticleDensity,
    toggleInfoDialog: state.toggleInfoDialog,
  }));

  const availableTracks = playlist?.tracks ?? [];
  const trackOptions = availableTracks.length
    ? availableTracks.map(option => ({ id: option.id, label: option.label }))
    : (['day', 'night'] satisfies Track[]).map(id => ({ id, label: id === 'day' ? 'Day' : 'Night' }));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div
        className={clsx(
          'pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-black/60 text-sm text-white shadow-lg backdrop-blur transition-all duration-300',
          focusMode && 'pointer-events-none translate-y-6 opacity-0'
        )}
      >
        <div className="flex flex-wrap items-center gap-4 p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={audioPlaying ? pauseAudio : playAudio}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-pressed={audioPlaying}
              aria-label={audioPlaying ? 'Pause audio playback' : 'Play audio playback'}
            >
              {audioPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              disabled={!audioReady}
              className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-pressed={audioMuted}
              aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {audioMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          <label className="flex items-center gap-2 whitespace-nowrap text-white/70">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={event => setAudioVolume(parseFloat(event.target.value))}
              disabled={!audioReady}
              className="w-28 accent-white/90 disabled:opacity-40"
              aria-label="Audio volume"
            />
          </label>

          <button
            type="button"
            onClick={toggleFocus}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-pressed={focusMode}
            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/60">Scene</span>
            <div className="flex gap-2" role="group" aria-label="Scene selection">
              {trackOptions.map(option => {
                const selected = track === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTrack(option.id)}
                    className={clsx(
                      'rounded-xl border border-white/15 px-3 py-2 font-medium transition',
                      selected ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                    aria-pressed={selected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.transliteration}
              onChange={event => setSubtitles({ ...subtitles, transliteration: event.target.checked })}
              className="accent-white"
              aria-label="Toggle transliteration subtitles"
            />
            Transliteration
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/70">
            <input
              type="checkbox"
              checked={subtitles.translation}
              onChange={event => setSubtitles({ ...subtitles, translation: event.target.checked })}
              className="accent-white"
              aria-label="Toggle translation subtitles"
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
              aria-label="Particle density"
            />
          </label>

          <button
            type="button"
            onClick={toggleInfoDialog}
            className="rounded-xl border border-white/15 px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Show information"
          >
            Info
          </button>
        </div>
      </div>

      {focusMode && (
        <div className="pointer-events-auto mt-2 flex justify-center">
          <button
            type="button"
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
