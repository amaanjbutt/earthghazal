'use client';
let _enabled = false;
let _volume = 0.6;
export function initAudio() { _enabled = true; }
export function setVolume(v: number) { _volume = Math.max(0, Math.min(1, v)); }
export function isAudioEnabled() { return _enabled; }
export function energy() { return 0; } // replace with AnalyserNode RMS later