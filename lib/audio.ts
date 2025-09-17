'use client';
let _enabled = false;
let _playing = false;
let _muted = false;
let _volume = 0.6;

export function initAudio() {
  _enabled = true;
  _playing = true;
}

export function play() {
  if (!_enabled) initAudio();
  _playing = true;
}

export function pause() {
  _playing = false;
}

export function setMuted(value: boolean) {
  _muted = value;
}

export function isMuted() {
  return _muted;
}

export function isPlaying() {
  return _playing;
}

export function setVolume(v: number) {
  _volume = Math.max(0, Math.min(1, v));
}

export function getVolume() {
  return _volume;
}

export function isAudioEnabled() {
  return _enabled;
}

export function energy() { return 0; } // replace with AnalyserNode RMS later
