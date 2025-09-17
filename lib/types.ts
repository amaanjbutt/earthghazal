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
export type Playlist = {
  track: Track;
  srcs: { type: 'mp4' | 'webm'; url: string }[];
  poster: string;
  loop: boolean;
};