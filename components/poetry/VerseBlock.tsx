'use client';
import { cn } from '@/lib/util';

export function VerseBlock({
  urdu,
  transliteration,
  translation,
  showTransliteration,
  showTranslation
}: {
  urdu?: string;
  transliteration?: string;
  translation?: string;
  showTransliteration: boolean;
  showTranslation: boolean;
}) {
  return (
    <div className="max-w-3xl text-center space-y-4">
      {urdu && (
        <p dir="rtl" className={cn("font-urdu text-3xl md:text-5xl leading-relaxed text-shadow-soft")}>
          {urdu}
        </p>
      )}
      {showTransliteration && transliteration && (
        <p className="text-white/70">{transliteration}</p>
      )}
      {showTranslation && translation && (
        <p className="font-serif text-white/80">{translation}</p>
      )}
    </div>
  );
}