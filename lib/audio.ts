'use client';

let audioContext: AudioContext | null = null;
let audioElement: HTMLAudioElement | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let timeDomainData: Float32Array | null = null;
let graphInitialized = false;
let desiredVolume = 0.6;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function ensureAudioElement() {
  if (typeof window === 'undefined') return null;
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.setAttribute('data-role', 'earth-audio');
    audioElement.crossOrigin = 'anonymous';
    audioElement.loop = true;
    audioElement.preload = 'auto';
    audioElement.playsInline = true;
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
  }
  return audioElement;
}

function initGraph() {
  const ctx = ensureContext();
  const element = ensureAudioElement();
  if (!ctx || !element) return null;
  if (!graphInitialized) {
    sourceNode = ctx.createMediaElementSource(element);
    gainNode = ctx.createGain();
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.85;
    sourceNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(ctx.destination);
    timeDomainData = new Float32Array(analyserNode.fftSize);
    graphInitialized = true;
  } else if (analyserNode && timeDomainData?.length !== analyserNode.fftSize) {
    timeDomainData = new Float32Array(analyserNode.fftSize);
  }
  if (gainNode) {
    gainNode.gain.value = desiredVolume;
  }
  return element;
}

export function initAudio() {
  return initGraph();
}

export async function play() {
  const element = initGraph();
  const ctx = audioContext;
  if (!element || !ctx) return;
  try {
    await ctx.resume();
  } catch (err) {
    // ignore resume errors (likely due to autoplay restrictions)
  }
  try {
    if (element.paused) await element.play();
  } catch (err) {
    // Swallow play rejections so callers can decide how to react.
  }
}

export function pause() {
  if (!audioElement) return;
  audioElement.pause();
}

export function setVolume(volume: number) {
  desiredVolume = Math.max(0, Math.min(1, volume));
  if (!gainNode) initGraph();
  if (gainNode) {
    gainNode.gain.value = desiredVolume;
  }
}

export function getEnergy() {
  if (!analyserNode || !timeDomainData) return 0;
  analyserNode.getFloatTimeDomainData(timeDomainData);
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i += 1) {
    const sample = timeDomainData[i];
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / timeDomainData.length);
}
