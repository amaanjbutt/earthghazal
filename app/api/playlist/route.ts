import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type { MediaSource, PlaylistManifest, Track, TrackManifest } from '@/lib/types';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const TRACK_LIBRARY: TrackManifest[] = [
  {
    id: 'day',
    label: 'Daybreak Orbit',
    poster: '/images/poster_day.jpg',
    loop: true,
    video: [
      {
        url: '/video/earth_day_2160.mp4',
        type: 'video/mp4',
        codec: 'hvc1.2.4.L150.90',
        width: 3840,
        height: 2160,
        bitrate: 16000000,
      },
      {
        url: '/video/earth_day_1080.mp4',
        type: 'video/mp4',
        codec: 'avc1.640028',
        width: 1920,
        height: 1080,
        bitrate: 8000000,
      },
      {
        url: '/video/earth_day_1080.mp4#720p',
        type: 'video/mp4',
        codec: 'avc1.64001f',
        width: 1280,
        height: 720,
        bitrate: 4500000,
      },
      {
        url: '/video/earth_day.webm',
        type: 'video/webm',
        codec: 'vp9',
        width: 1920,
        height: 1080,
        bitrate: 6000000,
      },
    ],
    audio: [
      { url: '/audio/earth_day.webm', type: 'audio/webm', codec: 'opus', bitrate: 256000 },
      { url: '/audio/earth_day.mp3', type: 'audio/mpeg', bitrate: 256000 },
    ],
  },
  {
    id: 'night',
    label: 'Nocturne Orbit',
    poster: '/images/poster_night.jpg',
    loop: true,
    video: [
      {
        url: '/video/earth_night_2160.mp4',
        type: 'video/mp4',
        codec: 'hvc1.2.4.L150.90',
        width: 3840,
        height: 2160,
        bitrate: 16000000,
      },
      {
        url: '/video/earth_night_1080.mp4',
        type: 'video/mp4',
        codec: 'avc1.640028',
        width: 1920,
        height: 1080,
        bitrate: 8000000,
      },
      {
        url: '/video/earth_night_1080.mp4#720p',
        type: 'video/mp4',
        codec: 'avc1.64001f',
        width: 1280,
        height: 720,
        bitrate: 4500000,
      },
      {
        url: '/video/earth_night.webm',
        type: 'video/webm',
        codec: 'vp9',
        width: 1920,
        height: 1080,
        bitrate: 6000000,
      },
    ],
    audio: [
      { url: '/audio/earth_night.webm', type: 'audio/webm', codec: 'opus', bitrate: 256000 },
      { url: '/audio/earth_night.mp3', type: 'audio/mpeg', bitrate: 256000 },
    ],
  },
];

const cleanUrl = (url: string) => {
  const [pathPart] = url.split('?');
  const [withoutHash] = pathPart.split('#');
  return withoutHash;
};

const sourceExists = (source: MediaSource) => {
  const url = cleanUrl(source.url);
  if (!url.startsWith('/')) return false;
  return existsSync(path.join(PUBLIC_DIR, url));
};

const filterExistingSources = (sources: MediaSource[]): MediaSource[] => {
  return sources.filter(sourceExists);
};

const parseNumberHeader = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const deriveTargetWidth = (request: NextRequest) => {
  const reportedWidth = parseNumberHeader(request.headers.get('sec-ch-width'));
  const viewportWidth = parseNumberHeader(request.headers.get('viewport-width'));
  const dpr = parseNumberHeader(request.headers.get('sec-ch-dpr')) ?? 1;
  const width = reportedWidth ?? viewportWidth;
  return (width ?? 1920) * dpr;
};

const prefersLowBandwidth = (request: NextRequest) => {
  const saveData = request.headers.get('save-data') ?? request.headers.get('sec-ch-save-data');
  return saveData?.toLowerCase() === 'on';
};

const sortVariants = (
  variants: MediaSource[],
  targetWidth: number,
  prioritizeEfficiency: boolean,
): MediaSource[] => {
  return [...variants].sort((a, b) => {
    const widthA = a.width ?? targetWidth;
    const widthB = b.width ?? targetWidth;
    const bitrateA = a.bitrate ?? Number.POSITIVE_INFINITY;
    const bitrateB = b.bitrate ?? Number.POSITIVE_INFINITY;

    if (prioritizeEfficiency) {
      if (widthA !== widthB) return widthA - widthB;
      if (bitrateA !== bitrateB) return bitrateA - bitrateB;
      return 0;
    }

    const diffA = Math.abs(widthA - targetWidth);
    const diffB = Math.abs(widthB - targetWidth);
    if (diffA !== diffB) return diffA - diffB;
    if (bitrateA !== bitrateB) return bitrateB - bitrateA;
    return widthB - widthA;
  });
};

const pickDefaultTrack = (request: NextRequest, tracks: TrackManifest[]): Track => {
  const hintedScheme = request.headers.get('sec-ch-prefers-color-scheme');
  const fallback: Track = 'day';
  if (!hintedScheme) return tracks.find(t => t.id === fallback)?.id ?? fallback;
  const scheme = hintedScheme.toLowerCase();
  if (scheme.includes('dark')) {
    return tracks.find(t => t.id === 'night')?.id ?? fallback;
  }
  if (scheme.includes('light')) {
    return tracks.find(t => t.id === 'day')?.id ?? fallback;
  }
  return tracks.find(t => t.id === fallback)?.id ?? fallback;
};

export async function GET(request: NextRequest) {
  const targetWidth = deriveTargetWidth(request);
  const efficient = prefersLowBandwidth(request);

  const availableTracks = TRACK_LIBRARY.map(track => {
    const video = sortVariants(filterExistingSources(track.video), targetWidth, efficient);
    const audio = track.audio ? filterExistingSources(track.audio) : undefined;
    return { ...track, video, audio } satisfies TrackManifest;
  }).filter(track => track.video.length > 0 || (track.audio && track.audio.length > 0));

  const defaultTrack = pickDefaultTrack(request, availableTracks);

  const manifest: PlaylistManifest = {
    tracks: availableTracks,
    defaultTrack,
  };

  return NextResponse.json(manifest);
}
