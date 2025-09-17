'use client';

import type { MediaSource, TrackManifest } from './types';

type AudioState = {
  element: HTMLAudioElement | null;
  context: AudioContext | null;
  source: MediaElementAudioSourceNode | null;
  gain: GainNode | null;
  analyser: AnalyserNode | null;
  energyBuffer: Float32Array | null;
  energy: number;
  raf: number | null;
  muted: boolean;
  volume: number;
  playing: boolean;
  ready: boolean;
};

const audioState: AudioState = {
  element: null,
  context: null,
  source: null,
  gain: null,
  analyser: null,
  energyBuffer: null,
  energy: 0,
  raf: null,
  muted: false,
  volume: 0.6,
  playing: false,
  ready: false,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const ensureElement = () => {
  if (typeof window === 'undefined') return null;
  if (!audioState.element) {
    const element = document.createElement('audio');
    element.crossOrigin = 'anonymous';
    element.loop = true;
    element.preload = 'auto';
    element.playsInline = true;
    element.style.display = 'none';
    document.body.appendChild(element);
    audioState.element = element;
  }
  return audioState.element;
};

const ensureContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioState.context) {
    const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!Ctor) return null;
    audioState.context = new Ctor();
  }
  return audioState.context;
};

const updateGain = () => {
  const target = audioState.muted ? 0 : audioState.volume;
  if (audioState.gain) {
    audioState.gain.gain.value = target;
  } else if (audioState.element) {
    audioState.element.volume = target;
  }
  if (audioState.element) {
    audioState.element.muted = audioState.muted && !audioState.gain;
  }
};

const startEnergyLoop = () => {
  if (typeof window === 'undefined') return;
  if (!audioState.analyser) return;
  if (!audioState.energyBuffer) {
    audioState.energyBuffer = new Float32Array(audioState.analyser.frequencyBinCount || 0);
  }
  if (!audioState.energyBuffer.length) return;
  if (audioState.raf !== null) return;

  const step = () => {
    if (!audioState.analyser || !audioState.energyBuffer) {
      audioState.raf = null;
      return;
    }
    audioState.analyser.getFloatFrequencyData(audioState.energyBuffer);
    let sum = 0;
    for (let i = 0; i < audioState.energyBuffer.length; i += 1) {
      const value = audioState.energyBuffer[i];
      const normalized = clamp((value + 100) / 100, 0, 1);
      sum += normalized;
    }
    audioState.energy = audioState.energyBuffer.length ? sum / audioState.energyBuffer.length : 0;
    audioState.raf = window.requestAnimationFrame(step);
  };

  audioState.raf = window.requestAnimationFrame(step);
};

const ensureNodes = () => {
  const element = ensureElement();
  const context = ensureContext();
  if (!element) return null;
  if (context && !audioState.source) {
    const source = context.createMediaElementSource(element);
    const gain = context.createGain();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(context.destination);
    audioState.source = source;
    audioState.gain = gain;
    audioState.analyser = analyser;
    audioState.energyBuffer = new Float32Array(analyser.frequencyBinCount);
  }
  updateGain();
  startEnergyLoop();
  return element;
};

const canPlaySource = (candidate: MediaSource): boolean => {
  if (typeof document === 'undefined') return true;
  const test = document.createElement('audio');
  const type = candidate.codec ? `${candidate.type}; codecs="${candidate.codec}"` : candidate.type;
  if (!type) return true;
  return test.canPlayType(type) !== '';
};

const selectAudioSource = (track: TrackManifest): MediaSource | undefined => {
  if (!track.audio || track.audio.length === 0) return undefined;
  const supported = track.audio.find(canPlaySource);
  return supported ?? track.audio[0];
};

export async function initAudio() {
  const element = ensureNodes();
  const context = ensureContext();
  if (!element) return;
  audioState.ready = true;
  if (context?.state === 'suspended') {
    try {
      await context.resume();
    } catch (error) {
      // Ignore resume errors; the caller can decide how to react.
    }
  }
}

export async function play() {
  const element = ensureNodes();
  if (!element) return;
  await initAudio();
  try {
    await element.play();
    audioState.playing = true;
  } catch (error) {
    audioState.playing = false;
  }
}

export function pause() {
  audioState.element?.pause();
  audioState.playing = false;
}

export function setMuted(value: boolean) {
  audioState.muted = value;
  updateGain();
}

export function setVolume(value: number) {
  audioState.volume = clamp(value, 0, 1);
  updateGain();
}

export function getVolume() {
  return audioState.volume;
}

export function getEnergy() {
  return audioState.energy;
}

export async function syncTrackAudio(track?: TrackManifest) {
  const element = ensureNodes();
  if (!element) return;
  if (!track || !track.audio || track.audio.length === 0) {
    element.pause();
    element.removeAttribute('src');
    element.load();
    audioState.playing = false;
    return;
  }
  const source = selectAudioSource(track);
  if (!source) return;
  if (element.src !== source.url) {
    element.src = source.url;
  }
  element.loop = track.loop ?? true;
  if (audioState.playing) {
    try {
      await element.play();
    } catch (error) {
      // Autoplay restrictions may block playback until the user interacts.
    }
  }
}
