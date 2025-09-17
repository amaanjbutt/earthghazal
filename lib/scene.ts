'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initAudio as prepareAudioGraph, play as playGraph, pause as pauseGraph, setVolume as setGraphVolume, getEnergy as measureEnergy } from './audio';
import type { Track } from './types';

type Subtitles = { transliteration: boolean; translation: boolean };

type AudioState = {
  enabled: boolean;
  volume: number;
  muted: boolean;
  energy: number;
};

type State = {
  track: Track;
  focusMode: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  audio: AudioState;
  energy: () => number;
  toggleTrack: () => void;
  toggleFocus: () => void;
  nextVerse: () => void;
  setSubtitles: (s: Subtitles) => void;
  setParticleDensity: (v: number) => void;
  initAudio: () => HTMLAudioElement | null;
  playAudio: () => Promise<void>;
  pauseAudio: () => void;
  setAudioVolume: (v: number) => void;
  toggleAudioMute: () => void;
  sampleAudioEnergy: () => void;
};

export const useSceneStore = create<State>()(persist((set, get) => ({
  track: 'day',
  focusMode: false,
  subtitles: { transliteration: false, translation: true },
  verseIndex: 0,
  verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
  particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
  audio: { enabled: false, volume: 0.6, muted: false, energy: 0 },
  energy: () => get().audio.energy,
  toggleTrack: () => set(s => ({ track: s.track === 'day' ? 'night' : 'day' })),
  toggleFocus: () => set(s => ({ focusMode: !s.focusMode })),
  nextVerse: () => set(s => ({ verseIndex: s.verseIndex + 1 })),
  setSubtitles: (subtitles) => set({ subtitles }),
  setParticleDensity: (v) => set({ particleDensity: v }),
  initAudio: () => {
    const element = prepareAudioGraph();
    const { audio } = get();
    setGraphVolume(audio.muted ? 0 : audio.volume);
    return element;
  },
  playAudio: async () => {
    const state = get();
    prepareAudioGraph();
    setGraphVolume(state.audio.muted ? 0 : state.audio.volume);
    try {
      await playGraph();
      set(s => ({ audio: { ...s.audio, enabled: true } }));
    } catch (err) {
      // Playback might fail due to browser restrictions.
    }
  },
  pauseAudio: () => {
    pauseGraph();
    set(s => ({ audio: { ...s.audio, enabled: false, energy: 0 } }));
  },
  setAudioVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const muted = get().audio.muted;
    prepareAudioGraph();
    setGraphVolume(muted ? 0 : clamped);
    set(s => ({ audio: { ...s.audio, volume: clamped } }));
  },
  toggleAudioMute: () => {
    prepareAudioGraph();
    set(s => {
      const muted = !s.audio.muted;
      setGraphVolume(muted ? 0 : s.audio.volume);
      return { audio: { ...s.audio, muted } };
    });
  },
  sampleAudioEnergy: () => {
    const energy = measureEnergy();
    set(s => ({ audio: { ...s.audio, energy } }));
  },
}), { name: 'earth-ghazal' }));
