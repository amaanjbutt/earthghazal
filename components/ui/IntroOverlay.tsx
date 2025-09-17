'use client';

import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/scene';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button',
  'textarea',
  'input',
  'select',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function IntroOverlay() {
  const audioReady = useSceneStore(s => s.audio.ready);
  const initAudio = useSceneStore(s => s.initAudio);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (audioReady) {
      previouslyFocused.current?.focus?.();
      previouslyFocused.current = null;
      return;
    }

    const node = overlayRef.current;
    if (!node) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusable = Array.from(
      node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
    ).filter(el => !el.hasAttribute('disabled'));

    (focusable[0] ?? node).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const active = document.activeElement as HTMLElement | null;
      const currentFocusable = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      ).filter(el => !el.hasAttribute('disabled'));
      if (!currentFocusable.length) return;
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];

      if (event.shiftKey) {
        if (!active || active === first || !node.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [audioReady]);

  if (audioReady) {
    return null;
  }

  const handleStart = () => {
    void initAudio();
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6 py-10">
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-heading"
        aria-describedby="intro-description"
        tabIndex={-1}
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/75 p-8 text-center shadow-2xl"
      >
        <h1 id="intro-heading" className="text-2xl font-semibold tracking-wide text-white">
          Experience Earth Ghazal with sound
        </h1>
        <p id="intro-description" className="mt-4 text-sm text-white/80 leading-relaxed">
          For the full immersion, enable audio and let the verses flow with the visuals. We&apos;ll remember your
          choice for next time.
        </p>
        <div className="mt-6 space-y-3 text-left text-xs text-white/60">
          <p className="font-medium text-white/80">While you listen:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Press <kbd className="rounded bg-white/10 px-1">F</kbd> to toggle focus mode.</li>
            <li>Press <kbd className="rounded bg-white/10 px-1">T</kbd> to switch between day and night once audio begins.</li>
            <li>Use the controls below to adjust subtitles, visuals, and volume.</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="mt-8 inline-flex w-full justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Start with sound
        </button>
      </div>
    </div>
  );
}
