// src/voicemode: voice mode in the window (ambient's spec m_11632; the TUI's voicemode/pane.rs).
// model.ts its words and keys (pure), VoicePane.tsx the pane, screen.tsx the store-fed
// ThreadVoice and useVoiceHere the thread mounts. Owner: amb-home.
export { ThreadVoice, useVoiceHere, type VoiceHere } from './screen';
export { VoicePane, type VoicePaneProps } from './VoicePane';
export { DOUBLE_CTRL_R_MS } from './model';
