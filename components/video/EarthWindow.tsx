'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneStore } from '@/lib/scene';
import type { PlaylistManifest, TrackManifest } from '@/lib/types';
import { syncTrackAudio } from '@/lib/audio';

const logError = (...args: Parameters<typeof console.error>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

const sourceType = (source: TrackManifest['video'][number]) =>
  source.codec ? `${source.type}; codecs="${source.codec}"` : source.type;

const pickTrack = (playlist: PlaylistManifest | undefined, trackId: TrackManifest['id']) => {
  if (!playlist) return undefined;
  return playlist.tracks.find(entry => entry.id === trackId);
};

const preloadPoster = (poster: string) => {
  if (typeof window === 'undefined') return;
  const image = new window.Image();
  image.src = poster;
};

export function EarthWindow() {
  const track = useSceneStore(s => s.track);
  const playlist = useSceneStore(s => s.playlist);
  const setPlaylist = useSceneStore(s => s.setPlaylist);

  useEffect(() => {
    if (playlist) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/playlist', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Unexpected ${response.status}`);
        const manifest = (await response.json()) as PlaylistManifest;
        if (!cancelled) {
          setPlaylist(manifest);
        }
      } catch (error) {
        if (!cancelled) {
          logError('Failed to load playlist manifest', error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playlist, setPlaylist]);

  const fallbackTrack = useMemo<TrackManifest>(
    () => ({
      id: track,
      label: track === 'day' ? 'Day' : 'Night',
      poster: `/images/poster_${track}.jpg`,
      loop: true,
      video: [
        {
          url: `/video/earth_${track}_1080.mp4`,
          type: 'video/mp4',
          width: 1920,
          height: 1080,
        },
        {
          url: `/video/earth_${track}_1080.mp4#720p`,
          type: 'video/mp4',
          width: 1280,
          height: 720,
        },
      ],
    }),
    [track],
  );

  const activeTrack = useMemo(
    () => pickTrack(playlist, track) ?? fallbackTrack,
    [fallbackTrack, playlist, track],
  );

  useEffect(() => {
    const pool = playlist?.tracks ?? [];
    if (!pool.length) return;
    const nextTrack = pool.find(entry => entry.id !== track);
    if (nextTrack) {
      preloadPoster(nextTrack.poster);
    }
  }, [playlist, track]);

  useEffect(() => {
    void syncTrackAudio(activeTrack);
  }, [activeTrack]);

  const orderedSources = useMemo(() => {
    if (!activeTrack) return [];
    if (typeof window === 'undefined') return activeTrack.video;
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth * dpr;
    return [...activeTrack.video].sort((a, b) => {
      const widthA = a.width ?? viewportWidth;
      const widthB = b.width ?? viewportWidth;
      const diffA = Math.abs(widthA - viewportWidth);
      const diffB = Math.abs(widthB - viewportWidth);
      if (diffA !== diffB) return diffA - diffB;
      const bitrateA = a.bitrate ?? Number.POSITIVE_INFINITY;
      const bitrateB = b.bitrate ?? Number.POSITIVE_INFINITY;
      if (bitrateA !== bitrateB) return bitrateB - bitrateA;
      return widthB - widthA;
    });
  }, [activeTrack]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTrack ? (
          <motion.video
            key={activeTrack.id}
            className="h-full w-full object-cover"
            poster={activeTrack.poster}
            autoPlay
            muted
            loop={activeTrack.loop !== false}
            playsInline
            preload="auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          >
            {orderedSources.map(source => (
              <source key={source.url} src={source.url} type={sourceType(source)} />
            ))}
          </motion.video>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
