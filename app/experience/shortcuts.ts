export type ExperienceControls = {
  audioReady: boolean;
  toggleFocus: () => void;
  toggleTrack: () => void;
  infoDialogOpen: boolean;
  setInfoDialogOpen: (open: boolean) => void;
};

export type ExperienceKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'defaultPrevented'
> & {
  preventDefault: () => void;
};

const normalize = (value?: string) => (value ? value.toLowerCase() : '');

const matchesShortcut = (event: ExperienceKeyEvent, key: string) => {
  const target = key.toLowerCase();
  const normalizedKey = normalize(event.key);
  const normalizedCode = normalize(event.code);
  return normalizedKey === target || normalizedCode === `key${target}`;
};

export const createExperienceKeyHandler = (
  getState: () => ExperienceControls,
) => {
  return (event: ExperienceKeyEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const isFocusShortcut = matchesShortcut(event, 'f');
    const isTrackShortcut = matchesShortcut(event, 't');
    const isInfoShortcut = matchesShortcut(event, 'i');

    if (!isFocusShortcut && !isTrackShortcut && !isInfoShortcut) {
      return;
    }

    event.preventDefault();

    const state = getState();

    if (isInfoShortcut) {
      const nextOpen = !state.infoDialogOpen;
      state.setInfoDialogOpen(nextOpen);
      return;
    }

    if (!state.audioReady) {
      return;
    }

    if (isFocusShortcut) {
      state.toggleFocus();
    }

    if (isTrackShortcut) {
      state.toggleTrack();
    }
  };
};
