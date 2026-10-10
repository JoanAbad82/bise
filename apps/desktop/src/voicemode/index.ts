// src/voicemode: voice mode in the window (designer's voice-window page (1), ambient's spec m_11632;
// the TUI's voicemode/pane.rs). model.ts its words and keys (pure), VoicePane.tsx the bar,
// screen.tsx the store-fed ThreadVoice, useVoiceHere, useVoiceLit and the typing pearl the thread
// mounts, said.ts his voice turns for 'said · 0:06'. Owner: amb-home.
export { ThreadVoice, useVoiceHere, useVoiceLit, VoiceTypePearl, type VoiceHere, type VoiceLit } from './screen';
export { VoicePane, type VoicePaneProps } from './VoicePane';
export { DOUBLE_CTRL_R_MS, TYPING_END, saidFor, typingLabelOf } from './model';
export { useSaidMs } from './said';

/** The composer's key line while he types in voice mode (the page's typing tab). */
export const VOICE_TYPING_KEYS = '⏎ send   tab back to voice   esc leave';
