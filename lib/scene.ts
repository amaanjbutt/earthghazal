'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  energy as audioEnergy,
  getVolume as getAudioVolume,
  initAudio as initAudioEngine,
  pause as pauseAudioEngine,
  play as playAudioEngine,
  setMuted as setAudioMuted,
  setVolume as setAudioVolumeEngine,
} from './audio';
import type { PlaylistManifest, Track } from './types';

type Subtitles = { transliteration: boolean; translation: boolean };

type State = {
   playlist?: PlaylistManifest;
   track: Track;
   focusMode: boolean;
   subtitles: Subtitles;
   verseIndex: number;
   verseIntervalMs: number;
   particleDensity: number;
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
   setSubtitles: (subtitles: Subtitles) => void;
   setParticleDensity: (value: number) => void;

   initAudio: () => void;
   playAudio: () => void;
   pauseAudio: () => void;
   toggleMute: () => void;
   setAudioVolume: (value: number) => void;
};

export const useSceneStore = create<State>()(
   persist(
     (set, get) => ({
       playlist: undefined,
       track: 'day',
       focusMode: false,
       subtitles: { transliteration: false, translation: true },
       verseIndex: 0,
       verseIntervalMs: Number(process.env.NEXT_PUBLIC_VERSE_INTERVAL_MS ?? 18000),
       particleDensity: Number(process.env.NEXT_PUBLIC_PARTICLE_DENSITY ?? 0.8),
       infoDialogOpen: false,

       audioReady: false,
       audioPlaying: false,
       audioMuted: false,
       audioVolume: getAudioVolume(),

       energy: () => audioEnergy(),

       setTrack: track => set({ track }),
       setPlaylist: playlist =>
         set(state => {
           const hasCurrent = playlist.tracks.some(entry => entry.id === state.track);
           return {
             playlist,
             track: hasCurrent ? state.track : playlist.defaultTrack,
           };
         }),
       toggleTrack: () =>
         set(state => {
           const options = state.playlist?.tracks;
           if (options && options.length > 0) {
             const currentIndex = options.findIndex(entry => entry.id === state.track);
             const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0;
             return { track: options[nextIndex]?.id ?? state.track };
           }
           return { track: state.track === 'day' ? 'night' : 'day' };
         }),
       toggleFocus: () => set(state => ({ focusMode: !state.focusMode })),
       toggleInfoDialog: () => set(state => ({ infoDialogOpen: !state.infoDialogOpen })),
       setInfoDialogOpen: open => set({ infoDialogOpen: open }),
       nextVerse: () => set(state => ({ verseIndex: state.verseIndex + 1 })),
       setSubtitles: subtitles => set({ subtitles }),
       setParticleDensity: value => set({ particleDensity: value }),

       initAudio: () => {
         if (get().audioReady) {
           void playAudioEngine();
           set({ audioPlaying: true });
           return;
         }
         void initAudioEngine();
         const { audioMuted, audioVolume } = get();
         setAudioVolumeEngine(audioVolume);
         setAudioMuted(audioMuted);
         void playAudioEngine();
         set({ audioReady: true, audioPlaying: true });
       },
       playAudio: () => {
         if (!get().audioReady) return;
         void playAudioEngine();
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
       setAudioVolume: value => {
         const clamped = Math.max(0, Math.min(1, value));
         set(state => {
           setAudioVolumeEngine(clamped);
           if (state.audioReady && state.audioMuted && clamped > 0) {
             setAudioMuted(false);
             return { audioVolume: clamped, audioMuted: false };
           }
           if (state.audioReady) {
             const autoMute = clamped === 0 ? true : state.audioMuted;
             setAudioMuted(autoMute);
             return { audioVolume: clamped, audioMuted: autoMute };
           }
           return { audioVolume: clamped };
         });
       },
     }),
     {
       name: 'earth-ghazal',
       partialize: ({
         track,
         focusMode,
         subtitles,
         verseIndex,
         verseIntervalMs,
         particleDensity,
         audioMuted,
         audioVolume,
       }) => ({
         track,
         focusMode,
         subtitles,
         verseIndex,
         verseIntervalMs,
         particleDensity,
         audioMuted,
         audioVolume,
       }),
     },
   ),
 );
