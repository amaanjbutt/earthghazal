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
- `I` — Info dialog

## Notes
- Audio graph is stubbed; wire Web Audio in `lib/audio.ts` later.
- Focus Mode now hides the control bar, dims the cursor, and leaves a subtle handle along with the `F` key to bring controls back.
- Particles scale with the slider and soften in Focus Mode.
- The Info dialog surfaces credits and guidance via the Info button or `I` key, and is fully keyboard accessible.
- Verse cycling uses `data/verses.json` and respects subtitle toggles.