'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaylistManifest, Track, TrackManifest } from './types';
import {
  energy as readAudioEnergy,
  initAudio as initAudioEngine,
  setVolume as setAudioEngineVolume,
  syncTrackAudio,
  stopAudio as stopAudioPlayback,
  getVolume as getAudioEngineVolume,
} from './audio';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resolveTrackManifest = (
  playlist: PlaylistManifest | undefined,
  trackId: Track,
): TrackManifest | undefined => playlist?.tracks.find(entry => entry.id === trackId);

type SubtitlesState = { transliteration: boolean; translation: boolean };

type AudioSlice = {
  ready: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  energy: number;
};

type SceneState = {
  playlist?: PlaylistManifest;
  track: Track;
  focusMode: boolean;
  infoDialogOpen: boolean;
  subtitles: SubtitlesState;
  verseIndex: number;
  verseIntervalMs: number;
  particleDensity: number;
  audio: AudioSlice;
};

type SceneActions = {
  setPlaylist: (playlist: PlaylistManifest) => void;
  setTrack: (track: Track) => void;
  toggleTrack: () => void;
  toggleFocus: () => void;
  toggleInfoDialog: () => void;
  setInfoDialogOpen: (open: boolean) => void;
  nextVerse: () => void;
  setSubtitles: (subtitles: SubtitlesState) => void;
  setParticleDensity: (value: number) => void;
  initAudio: () => Promise<void>;
  playAudio: () => Promise<void>;
  pauseAudio: () => void;
  toggleAudioMute: () => void;
  setAudioVolume: (value: number) => void;
  sampleAudioEnergy: () => void;
};

type SceneStore = SceneState & SceneActions;

const DEFAULT_SUBTITLES: SubtitlesState = { transliteration: false, translation: true };
const DEFAULT_VERSE_INTERVAL = Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18_000);
const DEFAULT_PARTICLE_DENSITY = Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8);

export const useSceneStore = create<SceneStore>()(
  persist(
    (set, get) => ({
      playlist: undefined,
      track: 'day',
      focusMode: false,
      infoDialogOpen: false,
      subtitles: DEFAULT_SUBTITLES,
      verseIndex: 0,
      verseIntervalMs: DEFAULT_VERSE_INTERVAL,
      particleDensity: DEFAULT_PARTICLE_DENSITY,
      audio: {
        ready: false,
        playing: false,
        muted: false,
        volume: getAudioEngineVolume(),
        energy: 0,
      },
      setPlaylist: playlist => {
        set(state => {
          const hasTrack = playlist.tracks.some(entry => entry.id === state.track);
          return {
            playlist,
            track: hasTrack ? state.track : playlist.defaultTrack,
          };
        });
        const state = get();
        if (state.audio.ready && state.audio.playing) {
          const active = resolveTrackManifest(state.playlist, state.track);
          if (active) {
            void syncTrackAudio(active);
          }
        }
      },
      setTrack: trackId => {
        set({ track: trackId });
        const state = get();
        if (state.audio.ready && state.audio.playing) {
          const active = resolveTrackManifest(state.playlist, trackId);
          if (active) {
            void syncTrackAudio(active);
          }
        }
      },
      toggleTrack: () => {
        const state = get();
        const options = state.playlist?.tracks ?? [];
        let nextTrack: Track = state.track === 'day' ? 'night' : 'day';
        if (options.length > 0) {
          const currentIndex = options.findIndex(entry => entry.id === state.track);
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0;
          nextTrack = options[nextIndex]?.id ?? nextTrack;
        }
        if (nextTrack === state.track) return;
        set({ track: nextTrack });
        const updated = get();
        if (updated.audio.ready && updated.audio.playing) {
          const active = resolveTrackManifest(updated.playlist, nextTrack);
          if (active) {
            void syncTrackAudio(active);
          }
        }
      },
      toggleFocus: () => {
        set(state => ({ focusMode: !state.focusMode }));
      },
      toggleInfoDialog: () => {
        set(state => ({ infoDialogOpen: !state.infoDialogOpen }));
      },
      setInfoDialogOpen: open => {
        set({ infoDialogOpen: open });
      },
      nextVerse: () => {
        set(state => ({ verseIndex: state.verseIndex + 1 }));
      },
      setSubtitles: subtitles => {
        set({ subtitles });
      },
      setParticleDensity: value => {
        set({ particleDensity: clamp(value, 0, 1.5) });
      },
      initAudio: async () => {
        const state = get();
        try {
          await initAudioEngine();
        } catch (error) {
          // Ignore initialization failures to avoid breaking UI controls.
        }
        setAudioEngineVolume(state.audio.muted ? 0 : state.audio.volume);
        set(current => ({
          audio: {
            ...current.audio,
            ready: true,
            playing: true,
          },
        }));
        const active = resolveTrackManifest(get().playlist, get().track);
        if (active) {
          void syncTrackAudio(active);
        }
      },
      playAudio: async () => {
        const state = get();
        if (!state.audio.ready) {
          await get().initAudio();
          return;
        }
        try {
          await initAudioEngine();
        } catch (error) {
          // Ignore resume failures and proceed with local state updates.
        }
        setAudioEngineVolume(state.audio.muted ? 0 : state.audio.volume);
        const active = resolveTrackManifest(state.playlist, state.track);
        if (active) {
          void syncTrackAudio(active);
        }
        set(current => ({
          audio: {
            ...current.audio,
            playing: true,
          },
        }));
      },
      pauseAudio: () => {
        stopAudioPlayback();
        set(state => ({
          audio: {
            ...state.audio,
            playing: false,
            energy: 0,
          },
        }));
      },
      toggleAudioMute: () => {
        set(state => {
          const nextMuted = !state.audio.muted;
          setAudioEngineVolume(nextMuted ? 0 : state.audio.volume);
          return {
            audio: {
              ...state.audio,
              muted: nextMuted,
            },
          };
        });
      },
      setAudioVolume: value => {
        set(state => {
          const clamped = clamp(value, 0, 1);
          const shouldUnmute = clamped > 0;
          const nextMuted = clamped === 0 ? true : shouldUnmute ? false : state.audio.muted;
          setAudioEngineVolume(nextMuted ? 0 : clamped);
          return {
            audio: {
              ...state.audio,
              volume: clamped,
              muted: nextMuted,
            },
          };
        });
      },
      sampleAudioEnergy: () => {
        const state = get();
        const energy = state.audio.playing ? readAudioEnergy() : 0;
        set(current => ({
          audio: {
            ...current.audio,
            energy,
          },
        }));
      },
    }),
    {
      name: 'earth-ghazal',
      partialize: ({ track, focusMode, subtitles, particleDensity, audio }) => ({
        track,
        focusMode,
        subtitles,
        particleDensity,
        audio: {
          muted: audio.muted,
          volume: audio.volume,
        },
      }),
    },
  ),
);
