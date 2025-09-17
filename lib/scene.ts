import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaylistManifest, Track } from './types';
import {
  initAudio as initAudioEngine,
  play as playAudioEngine,
  pause as pauseAudioEngine,
  setMuted as setAudioMuted,
  setVolume as setAudioVolumeEngine,
  getVolume as getAudioVolume,
  getEnergy as readAudioEnergy,
  syncTrackAudio,
} from './audio';

type Subtitles = { transliteration: boolean; translation: boolean };

type AudioMeta = { enabled: boolean; energy: number };

type State = {
  playlist?: PlaylistManifest;
  track: Track;
  focusMode: boolean;
  infoDialogOpen: boolean;
  subtitles: Subtitles;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  audio: AudioMeta;
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
  setSubtitles: (subtitles: Subtitles) => void;
  setParticleDensity: (value: number) => void;
  initAudio: () => Promise<void>;
  playAudio: () => Promise<void>;
  pauseAudio: () => void;
  toggleMute: () => void;
  setAudioVolume: (value: number) => void;
  sampleAudioEnergy: () => void;
};

export const useSceneStore = create<State>()(
  persist((set, get) => {
    const ensureTrackAudio = (nextTrack: Track, playlist?: PlaylistManifest) => {
      const { audioReady } = get();
      if (!audioReady) return;
      const activePlaylist = playlist ?? get().playlist;
      const manifest = activePlaylist?.tracks.find(entry => entry.id === nextTrack);
      void syncTrackAudio(manifest);
    };

    return {
      playlist: undefined,
      track: 'day',
      focusMode: false,
      infoDialogOpen: false,
      subtitles: { transliteration: false, translation: true },
      verseIndex: 0,
      verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
      particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
      audio: { enabled: false, energy: 0 },
      audioReady: false,
      audioPlaying: false,
      audioMuted: false,
      audioVolume: getAudioVolume(),
      energy: () => get().audio.energy,

      setTrack: track => {
        if (get().track === track) return;
        ensureTrackAudio(track);
        set({ track });
      },

      setPlaylist: playlist => {
        set(state => {
          const hasCurrent = playlist.tracks.some(entry => entry.id === state.track);
          const nextTrack = hasCurrent ? state.track : playlist.defaultTrack;
          ensureTrackAudio(nextTrack, playlist);
          return { playlist, track: nextTrack };
        });
      },

      toggleTrack: () => {
        set(state => {
          let nextTrack: Track;
          const available = state.playlist?.tracks;
          if (available && available.length > 0) {
            const currentIndex = available.findIndex(entry => entry.id === state.track);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % available.length : 0;
            nextTrack = available[nextIndex]?.id ?? state.track;
          } else {
            nextTrack = state.track === 'day' ? 'night' : 'day';
          }
          ensureTrackAudio(nextTrack);
          return { track: nextTrack };
        });
      },

      toggleFocus: () => set(state => ({ focusMode: !state.focusMode })),
      toggleInfoDialog: () => set(state => ({ infoDialogOpen: !state.infoDialogOpen })),
      setInfoDialogOpen: open => set({ infoDialogOpen: open }),
      nextVerse: () => set(state => ({ verseIndex: state.verseIndex + 1 })),
      setSubtitles: subtitles => set({ subtitles }),
      setParticleDensity: value => set({ particleDensity: value }),

      initAudio: async () => {
        if (get().audioReady) {
          await get().playAudio();
          return;
        }
        await initAudioEngine();
        setAudioVolumeEngine(get().audioVolume);
        setAudioMuted(get().audioMuted);
        await playAudioEngine();
        set({
          audioReady: true,
          audioPlaying: true,
          audioMuted: get().audioMuted,
          audio: { enabled: true, energy: readAudioEnergy() },
        });
        ensureTrackAudio(get().track);
      },

      playAudio: async () => {
        if (!get().audioReady) {
          await get().initAudio();
          return;
        }
        await playAudioEngine();
        set(state => ({
          audioPlaying: true,
          audio: { ...state.audio, enabled: true },
        }));
      },

      pauseAudio: () => {
        if (!get().audioReady) return;
        pauseAudioEngine();
        set(state => ({
          audioPlaying: false,
          audio: { ...state.audio, enabled: false, energy: 0 },
        }));
      },

      toggleMute: () => {
        const nextMuted = !get().audioMuted;
        setAudioMuted(nextMuted);
        set({ audioMuted: nextMuted });
      },

      setAudioVolume: value => {
        const clamped = Math.max(0, Math.min(1, value));
        setAudioVolumeEngine(clamped);
        if (clamped === 0) {
          setAudioMuted(true);
        }
        set(state => ({
          audioVolume: clamped,
          audioMuted: clamped === 0 ? true : state.audioMuted,
        }));
        if (clamped > 0 && get().audioMuted) {
          setAudioMuted(false);
          set({ audioMuted: false });
        }
      },

      sampleAudioEnergy: () => {
        const energy = readAudioEnergy();
        set(state => ({
          audio: { enabled: state.audioPlaying, energy },
        }));
      },
    };
  }, {
    name: 'earth-ghazal',
    partialize: ({ track, focusMode, subtitles, verseIndex, verseIntervalMs, particleDensity }) => ({
      track,
      focusMode,
      subtitles,
      verseIndex,
      verseIntervalMs,
      particleDensity,
    }),
  }),
);
