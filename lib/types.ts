export type Verse = {
  id: string;
  lang: 'ur' | 'en';
  rtl?: boolean;
  text: string;
  transliteration?: string;
  translation?: string;
  credit?: { author: string; source?: string; license?: string };
  displayMs?: number;
};
export type Track = 'day' | 'night';

export type MediaSource = {
  url: string;
  type: string;
  codec?: string;
  width?: number;
  height?: number;
  bitrate?: number;
};

export type TrackManifest = {
  id: Track;
  label: string;
  poster: string;
  loop?: boolean;
  video: MediaSource[];
  audio?: MediaSource[];
};

export type PlaylistManifest = {
  tracks: TrackManifest[];
  defaultTrack: Track;
};