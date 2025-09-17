# Earth Ghazal — ISS Meditative Experience (Starter)

## Quickstart
```bash
pnpm i
pnpm dev
# open http://localhost:3000
```
Add assets under `public/`:
- `public/video/earth_day_1080.mp4`, `public/video/earth_night_1080.mp4` (and optional 2160 variants)
- `public/images/poster_day.jpg`, `public/images/poster_night.jpg`

## Keyboard
- `F` — Focus Mode
- `T` — Toggle Day/Night

## Notes
- Audio graph is stubbed; wire Web Audio in `lib/audio.ts` later.
- Particles scale with the slider and dim in Focus Mode.
- Verse cycling uses `data/verses.json` and respects subtitle toggles.