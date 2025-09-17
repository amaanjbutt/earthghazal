'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import Link from 'next/link';
import { useSceneStore } from '@/lib/scene';

export function InfoDialog() {
  const open = useSceneStore(s => s.infoDialogOpen);
  const setOpen = useSceneStore(s => s.setInfoDialogOpen);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      setOpen(false);
    };
    const handleClose = () => setOpen(false);
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [setOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.classList.add('info-dialog-open');
      requestAnimationFrame(() => {
        initialFocusRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
      document.body.classList.remove('info-dialog-open');
    } else {
      document.body.classList.remove('info-dialog-open');
    }
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('info-dialog-open');
    };
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInDialog) {
      setOpen(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="info-dialog-title"
      className="max-w-xl w-[min(92vw,34rem)] rounded-3xl border border-white/10 bg-black/75 p-0 text-left text-white shadow-2xl"
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col gap-6 p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Earth Ghazal</p>
            <h2 id="info-dialog-title" className="mt-1 text-lg font-semibold">
              Meditative viewing guide
            </h2>
          </div>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </header>
        <section className="space-y-3 text-sm leading-relaxed text-white/80">
          <p>
            Drift with the International Space Station and let the ghazal wash over you. Use focus
            mode to dim controls and the cursor, or keep the interface present while you explore the
            verses and soundtrack.
          </p>
          <p>
            Shortcuts keep the flow gentle: <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">F</kbd>{' '}
            toggles focus, <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">T</kbd> swaps day and night,
            and <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">I</kbd> reveals this guide.
          </p>
        </section>
        <section className="space-y-2 text-sm text-white/60">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Credits</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ISS imagery courtesy of{' '}
              <Link href="https://www.nasa.gov/" target="_blank" rel="noreferrer" className="text-white/80 underline decoration-white/30 hover:decoration-white/70">
                NASA
              </Link>
              .
            </li>
            <li>
              Poetry adapted from traditional ghazal forms; review the project README for verse
              sources and translation notes.
            </li>
            <li>
              Experience crafted with care by the Earth Ghazal team and the open-source community.
            </li>
          </ul>
        </section>
        <footer className="flex items-center justify-end gap-3 text-sm text-white/70">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/10 px-4 py-1.5 transition hover:bg-white/10 hover:text-white"
          >
            Return to orbit
          </button>
        </footer>
      </div>
    </dialog>
  );
}
