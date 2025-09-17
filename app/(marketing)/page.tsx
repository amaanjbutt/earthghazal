import Link from "next/link";
import { motion } from "framer-motion";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center space-y-6"
      >
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Earth Ghazal</h1>
        <p className="text-balance text-white/70">
          A window, a breath. Begin when you&apos;re ready.
        </p>
        <Link
          href="/experience"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/5 transition"
        >
          Enter
        </Link>
      </motion.div>
    </main>
  );
}