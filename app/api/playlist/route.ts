import { NextResponse } from 'next/server';

export async function GET() {
  const width = 1920; // could parse User-Agent-Client-Hints to pick 1080/2160
  const mp4 = width >= 2000 ? '2160' : '1080';
  return NextResponse.json({
    track: 'day',
    srcs: [
      { type: 'mp4', url: `/video/earth_day_${mp4}.mp4` },
      { type: 'webm', url: `/video/earth_day.webm` }
    ],
    poster: '/images/poster_day.jpg',
    loop: true
  });
}