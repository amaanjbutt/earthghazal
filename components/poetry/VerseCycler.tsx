'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import versesJson from '@/data/verses.json';
import { useSceneStore } from '@/lib/scene';
import { VerseBlock } from './VerseBlock';

type Verse = typeof versesJson.verses[number];

export function VerseCycler() {
  const showTransliteration = useSceneStore(s => s.subtitles.transliteration);
  const showTranslation = useSceneStore(s => s.subtitles.translation);
  const index = useSceneStore(s => s.verseIndex);
  const next = useSceneStore(s => s.nextVerse);
  const interval = useSceneStore(s => s.verseIntervalMs);

  const current = (versesJson.verses as Verse[])[index % versesJson.verses.length];

  const verseDuration = current.displayMs ?? interval;

  // Rotate verses
  // Minimal internal scheduler; could be replaced with a more robust system.
  // Uses visibility guard so background tabs don't spam updates.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = window.setInterval(() => {
      if (!document.hidden) next();
    }, verseDuration);

    return () => {
      window.clearInterval(timer);
    };
  }, [index, next, verseDuration]);

  return (
    <div className="pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="px-6"
        >
          <VerseBlock
            urdu={current.lang === 'ur' ? current.text : undefined}
            transliteration={current.transliteration}
            translation={
              current.translation ??
              (current.lang === 'en' ? current.text : undefined)
            }
            showTransliteration={showTransliteration}
            showTranslation={showTranslation}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}