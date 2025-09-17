'use client';

import type { MediaSource, TrackManifest } from './types';

type Channel = {
  element?: HTMLAudioElement;
  source?: MediaElementAudioSourceNode;
  gain?: GainNode;
  trackId?: TrackManifest['id'];
};

const channels: [Channel, Channel] = [{}, {}];
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let masterGain: GainNode | null = null;
let enabled = false;
let volume = 0.6;
let activeChannelIndex = 0;
let energyValue = 0;
let energyBuffer: Uint8Array | null = null;
let energyRaf: number | null = null;

const CROSS_FADE_SECONDS = 1.4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const debugWarn = (...args: Parameters<typeof console.warn>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};

const ensureContext = () => {
  if (typeof window === 'undefined') return;
  if (audioContext) return;
  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const ContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!ContextCtor) return;
  audioContext = new ContextCtor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = volume;
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  masterGain.connect(analyser);
  analyser.connect(audioContext.destination);
  energyBuffer = new Uint8Array(analyser.frequencyBinCount);
  startEnergyLoop();
};

const startEnergyLoop = () => {
  if (!analyser || !energyBuffer || energyRaf !== null || typeof window === 'undefined') return;
  const step = () => {
    if (!analyser || !energyBuffer) {
      energyRaf = null;
      return;
    }
    analyser.getByteFrequencyData(energyBuffer);
    let sum = 0;
    for (let i = 0; i < energyBuffer.length; i += 1) {
      sum += energyBuffer[i];
    }
    const average = energyBuffer.length ? sum / energyBuffer.length : 0;
    energyValue = average / 255;
    energyRaf = window.requestAnimationFrame(step);
  };
  energyRaf = window.requestAnimationFrame(step);
};

const getChannel = (index: number): Channel => {
  const channel = channels[index];
  if (typeof window !== 'undefined' && !channel.element) {
    channel.element = new Audio();
    channel.element.loop = true;
    channel.element.preload = 'auto';
    channel.element.crossOrigin = 'anonymous';
    channel.element.volume = volume;
  }
  if (channel.element && audioContext && masterGain && !channel.source) {
    channel.source = audioContext.createMediaElementSource(channel.element);
    channel.gain = audioContext.createGain();
    channel.gain.gain.value = channel.element.paused ? 0 : 1;
    channel.source.connect(channel.gain);
    channel.gain.connect(masterGain);
    channel.element.volume = 1;
  }
  return channel;
};

const stopChannel = (channel: Channel) => {
  if (!channel.element) return;
  if (channel.gain && audioContext) {
    const now = audioContext.currentTime;
    channel.gain.gain.cancelScheduledValues(now);
    channel.gain.gain.setValueAtTime(0, now);
  }
  channel.element.pause();
};

const animateGain = (channel: Channel, target: number, duration: number) => {
  const channelElement = channel.element;
  if (channel.gain && audioContext) {
    const now = audioContext.currentTime;
    channel.gain.gain.cancelScheduledValues(now);
    channel.gain.gain.setValueAtTime(channel.gain.gain.value, now);
    channel.gain.gain.linearRampToValueAtTime(target, now + duration);
    return;
  }
  if (!channelElement || typeof window === 'undefined') return;
  const startVolume = channelElement.volume;
  const targetVolume = target * volume;
  const startTime = performance.now();
  const tick = (time: number) => {
    const progress = clamp((time - startTime) / (duration * 1000), 0, 1);
    channelElement.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else if (targetVolume === 0) {
      channelElement.pause();
    }
  };
  window.requestAnimationFrame(tick);
};

const canPlaySource = (candidate: MediaSource): boolean => {
  if (typeof document === 'undefined') return true;
  const testElement = document.createElement('audio');
  const type = candidate.codec ? `${candidate.type}; codecs="${candidate.codec}"` : candidate.type;
  if (!type) return true;
  return testElement.canPlayType(type) !== '';
};

const selectAudioSource = (track: TrackManifest): MediaSource | undefined => {
  if (!track.audio || track.audio.length === 0) return undefined;
  const supported = track.audio.find(canPlaySource);
  return supported ?? track.audio[0];
};

export async function initAudio() {
  ensureContext();
  enabled = true;
  if (audioContext?.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (err) {
      debugWarn('Unable to resume audio context', err);
    }
  }
}

export function setVolume(next: number) {
  volume = clamp(next, 0, 1);
  if (masterGain) {
    masterGain.gain.value = volume;
  } else {
    channels.forEach((channel, index) => {
      if (channel.element && !channel.gain) {
        const isActive = index === activeChannelIndex;
        channel.element.volume = (isActive ? 1 : 0) * volume;
      }
    });
  }
}

export function isAudioEnabled() {
  return enabled;
}

export function energy() {
  return energyValue;
}

const pauseAfterFade = (channel: Channel, duration: number) => {
  if (!channel.element || typeof window === 'undefined') return;
  window.setTimeout(() => {
    if (!channel.element) return;
    if (channel.gain) {
      // When using Web Audio we leave the element playing silently.
      return;
    }
    if (channel.element.volume === 0) {
      channel.element.pause();
    }
  }, duration * 1000 + 120);
};

export async function syncTrackAudio(track?: TrackManifest) {
  if (!track || !track.audio || track.audio.length === 0) {
    const current = getChannel(activeChannelIndex);
    animateGain(current, 0, CROSS_FADE_SECONDS / 2);
    pauseAfterFade(current, CROSS_FADE_SECONDS / 2);
    return;
  }

  ensureContext();
  const nextIndex = 1 - activeChannelIndex;
  const nextChannel = getChannel(nextIndex);
  const currentChannel = getChannel(activeChannelIndex);
  const audioSource = selectAudioSource(track);

  if (!audioSource || !nextChannel.element) return;

  if (nextChannel.element.src !== audioSource.url) {
    nextChannel.element.src = audioSource.url;
  }
  nextChannel.element.loop = track.loop ?? true;

  try {
    await nextChannel.element.play();
  } catch (err) {
    // Autoplay policies might block playback until the user interacts with the page.
    debugWarn('Audio playback blocked until user interaction', err);
  }

  if (enabled && audioContext?.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (err) {
      debugWarn('Unable to resume suspended audio context', err);
    }
  }

  animateGain(nextChannel, 1, CROSS_FADE_SECONDS);
  animateGain(currentChannel, 0, CROSS_FADE_SECONDS);
  pauseAfterFade(currentChannel, CROSS_FADE_SECONDS);

  nextChannel.trackId = track.id;
  activeChannelIndex = nextIndex;
}

export function stopAudio() {
  channels.forEach(stopChannel);
  activeChannelIndex = 0;
}

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
