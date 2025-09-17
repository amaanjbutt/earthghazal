'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaylistManifest, Track } from './types';
import { energy as audioEnergy } from './audio';

type Subtitles = { transliteration: boolean; translation: boolean };

type State = {
  playlist?: PlaylistManifest;
  track: Track;
  focusMode: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  energy: () => number;
  setTrack: (track: Track) => void;
  setPlaylist: (playlist: PlaylistManifest) => void;
  toggleTrack: () => void;
  toggleFocus: () => void;
  nextVerse: () => void;
  setSubtitles: (s: Subtitles) => void;
  setParticleDensity: (v: number) => void;
};

export const useSceneStore = create<State>()(persist((set) => ({
  playlist: undefined,
  track: 'day',
  focusMode: false,
  subtitles: { transliteration: false, translation: true },
  verseIndex: 0,
  verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
  particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
  energy: () => audioEnergy(),
  setTrack: (track) => set({ track }),
  setPlaylist: (playlist) => set(state => {
    const hasCurrent = playlist.tracks.some(entry => entry.id === state.track);
    return {
      playlist,
      track: hasCurrent ? state.track : playlist.defaultTrack,
    };
  }),
  toggleTrack: () => set(state => {
    const available = state.playlist?.tracks;
    if (!available || available.length === 0) {
      return { track: state.track === 'day' ? 'night' : 'day' };
    }
    const currentIndex = available.findIndex(entry => entry.id === state.track);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % available.length : 0;
    return { track: available[nextIndex]?.id ?? state.track };
  }),
  toggleFocus: () => set(s => ({ focusMode: !s.focusMode })),
  nextVerse: () => set(s => ({ verseIndex: s.verseIndex + 1 })),
  setSubtitles: (subtitles) => set({ subtitles }),
  setParticleDensity: (v) => set({ particleDensity: v }),
}), {
  name: 'earth-ghazal',
  partialize: ({
    track,
    focusMode,
    subtitles,
    verseIndex,
    verseIntervalMs,
    particleDensity,
  }) => ({
    track,
    focusMode,
    subtitles,
    verseIndex,
    verseIntervalMs,
    particleDensity,
  }),
}));