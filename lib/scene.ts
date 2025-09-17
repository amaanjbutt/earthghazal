'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './types';
import {
  energy as audioEnergy,
  initAudio as initAudioEngine,
  pause as pauseAudioEngine,
  play as playAudioEngine,
  setMuted as setAudioMuted,
  setVolume as setAudioVolumeEngine,
  getVolume as getAudioVolume,
} from './audio';

type Subtitles = { transliteration: boolean; translation: boolean };

type State = {
  track: Track;
  focusMode: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  audioReady: boolean;
  audioPlaying: boolean;
  audioMuted: boolean;
  audioVolume: number;
  energy: () => number;
  toggleTrack: () => void;
  toggleFocus: () => void;
  nextVerse: () => void;
  setSubtitles: (s: Subtitles) => void;
  setParticleDensity: (v: number) => void;
  initAudio: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  toggleMute: () => void;
  setAudioVolume: (v: number) => void;
};

export const useSceneStore = create<State>()(persist((set, get) => ({
  track: 'day',
  focusMode: false,
  subtitles: { transliteration: false, translation: true },
  verseIndex: 0,
  verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
  particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
  audioReady: false,
  audioPlaying: false,
  audioMuted: false,
  audioVolume: getAudioVolume(),
  energy: () => audioEnergy(), // placeholder for audio-reactive energy
  toggleTrack: () => set(s => (s.audioReady ? { track: s.track === 'day' ? 'night' : 'day' } : {})),
  toggleFocus: () => set(s => ({ focusMode: !s.focusMode })),
  nextVerse: () => set(s => ({ verseIndex: s.verseIndex + 1 })),
  setSubtitles: (subtitles) => set({ subtitles }),
  setParticleDensity: (v) => set({ particleDensity: v }),
  initAudio: () => {
    if (get().audioReady) {
      playAudioEngine();
      set({ audioPlaying: true });
      return;
    }
    initAudioEngine();
    const { audioMuted, audioVolume } = get();
    setAudioVolumeEngine(audioVolume);
    setAudioMuted(audioMuted);
    playAudioEngine();
    set({ audioReady: true, audioPlaying: true });
  },
  playAudio: () => {
    if (!get().audioReady) return;
    playAudioEngine();
    set({ audioPlaying: true });
  },
  pauseAudio: () => {
    if (!get().audioReady) return;
    pauseAudioEngine();
    set({ audioPlaying: false });
  },
  toggleMute: () => {
    if (!get().audioReady) return;
    set(state => {
      const nextMuted = !state.audioMuted;
      setAudioMuted(nextMuted);
      return { audioMuted: nextMuted };
    });
  },
  setAudioVolume: (value: number) => {
    set(state => {
      const clamped = Math.max(0, Math.min(1, value));
      setAudioVolumeEngine(clamped);
      if (state.audioReady && state.audioMuted && clamped > 0) {
        setAudioMuted(false);
        return { audioVolume: clamped, audioMuted: false };
      }
      if (state.audioReady) {
        setAudioMuted(clamped === 0 ? true : state.audioMuted);
        return {
          audioVolume: clamped,
          audioMuted: clamped === 0 ? true : state.audioMuted,
        };
      }
      return { audioVolume: clamped };
    });
  },
}), { name: 'earth-ghazal' }));
