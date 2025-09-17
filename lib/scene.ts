'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaylistManifest, Track } from './types';
import { energy as audioEnergy } from './audio';
import { initAudio as prepareAudioGraph, play as playGraph, pause as pauseGraph, setVolume as setGraphVolume, getEnergy as measureEnergy } from './audio';
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

type AudioState = {
  enabled: boolean;
  volume: number;
  muted: boolean;
  energy: number;
};

type State = {
  playlist?: PlaylistManifest;
  track: Track;
  focusMode: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;

  audio: AudioState;


  infoDialogOpen: boolean;

  audioReady: boolean;
  audioPlaying: boolean;
  audioMuted: boolean;
  audioVolume: number;

  energy: () => number;
  setTrack: (track: Track) => void;
  setPlaylist: (playlist: PlaylistManifest) => void;
  toggleTrack: () => void;
  toggleFocus: () => void;
  toggleInfoDialog: () => void;
  setInfoDialogOpen: (open: boolean) => void;
  nextVerse: () => void;
  setSubtitles: (s: Subtitles) => void;
  setParticleDensity: (v: number) => void;

  initAudio: () => HTMLAudioElement | null;
  playAudio: () => Promise<void>;
  pauseAudio: () => void;
  setAudioVolume: (v: number) => void;
  toggleAudioMute: () => void;
  sampleAudioEnergy: () => void;

  initAudio: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  toggleMute: () => void;
  setAudioVolume: (v: number) => void;

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

  audio: { enabled: false, volume: 0.6, muted: false, energy: 0 },
  energy: () => get().audio.energy,

  infoDialogOpen: false,
  energy: () => 0, // placeholder for audio-reactive energy

  toggleTrack: () => set(s => ({ track: s.track === 'day' ? 'night' : 'day' })),

  audioReady: false,
  audioPlaying: false,
  audioMuted: false,
  audioVolume: getAudioVolume(),
  energy: () => audioEnergy(), // placeholder for audio-reactive energy
  toggleTrack: () => set(s => (s.audioReady ? { track: s.track === 'day' ? 'night' : 'day' } : {})),


  toggleFocus: () => set(s => ({ focusMode: !s.focusMode })),
  toggleInfoDialog: () => set(s => ({ infoDialogOpen: !s.infoDialogOpen })),
  setInfoDialogOpen: (open) => set({ infoDialogOpen: open }),
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

