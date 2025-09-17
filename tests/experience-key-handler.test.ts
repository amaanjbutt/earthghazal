import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createExperienceKeyHandler,
  type ExperienceControls,
  type ExperienceKeyEvent,
} from '@/app/experience/shortcuts';

const createTestEvent = (key: string): (ExperienceKeyEvent & { prevented: boolean }) => {
  const event: ExperienceKeyEvent & { prevented: boolean } = {
    key,
    code: `Key${key.toUpperCase()}`,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    defaultPrevented: false,
    prevented: false,
    preventDefault() {
      event.defaultPrevented = true;
      event.prevented = true;
    },
  };
  return event;
};

type StubState = ExperienceControls & {
  focusMode: boolean;
  track: 'day' | 'night';
  focusToggles: number;
  trackToggles: number;
};

const createStubState = (overrides: Partial<StubState> = {}): StubState => {
  const state: StubState = {
    audioReady: true,
    infoDialogOpen: false,
    focusMode: false,
    track: 'day',
    focusToggles: 0,
    trackToggles: 0,
    toggleFocus: () => {
      state.focusToggles += 1;
      state.focusMode = !state.focusMode;
    },
    toggleTrack: () => {
      state.trackToggles += 1;
      state.track = state.track === 'day' ? 'night' : 'day';
    },
    setInfoDialogOpen: (open: boolean) => {
      state.infoDialogOpen = open;
    },
    ...overrides,
  };

  return state;
};

test('pressing F toggles focus when audio is ready', () => {
  const state = createStubState();
  const handler = createExperienceKeyHandler(() => state);
  const event = createTestEvent('f');

  handler(event);

  assert.equal(state.focusMode, true);
  assert.equal(state.focusToggles, 1);
  assert.equal(event.prevented, true);
});

test('pressing T toggles track when audio is ready', () => {
  const state = createStubState();
  const handler = createExperienceKeyHandler(() => state);
  const event = createTestEvent('t');

  handler(event);

  assert.equal(state.track, 'night');
  assert.equal(state.trackToggles, 1);
  assert.equal(event.prevented, true);
});
