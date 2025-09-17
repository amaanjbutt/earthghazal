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
let muted = false;
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
  masterGain.gain.value = muted ? 0 : volume;
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
    const isActive = index === activeChannelIndex;
    channel.element.volume = muted ? 0 : (isActive ? volume : 0);
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
  channel.trackId = undefined;
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
  const baseVolume = muted ? 0 : volume;
  const targetVolume = target * baseVolume;
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

export async function play() {
  ensureContext();
  const channel = getChannel(activeChannelIndex);
  const element = channel.element;
  if (audioContext?.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (err) {
      debugWarn('Unable to resume suspended audio context', err);
    }
  }
  if (element) {
    try {
      await element.play();
    } catch (err) {
      debugWarn('Audio playback blocked until user interaction', err);
    }
  }
  if (channel.gain && audioContext) {
    const now = audioContext.currentTime;
    channel.gain.gain.cancelScheduledValues(now);
    channel.gain.gain.setValueAtTime(1, now);
  } else if (element && !channel.gain) {
    element.volume = muted ? 0 : volume;
  }
  enabled = true;
}

export function pause() {
  channels.forEach(channel => {
    if (!channel.element) return;
    if (channel.gain && audioContext) {
      const now = audioContext.currentTime;
      channel.gain.gain.cancelScheduledValues(now);
      channel.gain.gain.setValueAtTime(0, now);
    } else if (!channel.gain) {
      channel.element.volume = 0;
    }
    channel.element.pause();
  });
  enabled = false;
}

export function setVolume(next: number) {
  volume = clamp(next, 0, 1);
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  } else {
    channels.forEach((channel, index) => {
      if (channel.element && !channel.gain) {
        const isActive = index === activeChannelIndex;
        const baseVolume = muted ? 0 : volume;
        channel.element.volume = isActive ? baseVolume : 0;
      }
    });
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
    return;
  }
  channels.forEach((channel, index) => {
    if (!channel.element || channel.gain) return;
    const isActive = index === activeChannelIndex;
    const baseVolume = muted ? 0 : volume;
    channel.element.volume = isActive ? baseVolume : 0;
  });
}

export function getVolume() {
  return volume;
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
  enabled = false;
}
