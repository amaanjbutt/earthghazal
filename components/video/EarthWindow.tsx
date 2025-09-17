'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSceneStore } from '@/lib/scene';

export function EarthWindow() {
  const track = useSceneStore(s => s.track);
  return (
    <div className="absolute inset-0 -z-10">
      <video
        key={track}
        className="h-full w-full object-cover"
        poster={`/images/poster_${track}.jpg`}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={`/video/earth_${track}_1080.mp4`} type="video/mp4" />
        <source src={`/video/earth_${track}.webm`} type="video/webm" />
      </video>
      <AnimatePresence mode="wait">
        <motion.div
          key={track + "_fade"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-black"
        />
      </AnimatePresence>
    </div>
  );
}