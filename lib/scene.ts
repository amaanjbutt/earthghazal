'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './types';

type Subtitles = { transliteration: boolean; translation: boolean };

type State = {
  track: Track;
  focusMode: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  infoDialogOpen: boolean;
  energy: () => number;
  toggleTrack: () => void;
  toggleFocus: () => void;
  toggleInfoDialog: () => void;
  setInfoDialogOpen: (open: boolean) => void;
  nextVerse: () => void;
  setSubtitles: (s: Subtitles) => void;
  setParticleDensity: (v: number) => void;
};

export const useSceneStore = create<State>()(persist((set, get) => ({
  track: 'day',
  focusMode: false,
  subtitles: { transliteration: false, translation: true },
  verseIndex: 0,
  verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
  particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
  infoDialogOpen: false,
  energy: () => 0, // placeholder for audio-reactive energy
  toggleTrack: () => set(s => ({ track: s.track === 'day' ? 'night' : 'day' })),
  toggleFocus: () => set(s => ({ focusMode: !s.focusMode })),
  toggleInfoDialog: () => set(s => ({ infoDialogOpen: !s.infoDialogOpen })),
  setInfoDialogOpen: (open) => set({ infoDialogOpen: open }),
  nextVerse: () => set(s => ({ verseIndex: s.verseIndex + 1 })),
  setSubtitles: (subtitles) => set({ subtitles }),
  setParticleDensity: (v) => set({ particleDensity: v }),
}), {
  name: 'earth-ghazal',
  partialize: ({
    infoDialogOpen,
    energy,
    toggleTrack,
    toggleFocus,
    toggleInfoDialog,
    setInfoDialogOpen,
    nextVerse,
    setSubtitles,
    setParticleDensity,
    ...rest
  }) => rest,
}));