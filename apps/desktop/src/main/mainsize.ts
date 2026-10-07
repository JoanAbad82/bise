// The main window's size (ambient m_11427 + m_11434, lead m_11436). Pure.
// Narrowest: 420 px, one column; below 640 amb-win folds the sidebar, so a
// narrow window never leaves a column where nothing fits. Electron keeps
// every frame at or above it (a drag, setBounds); main saves no frame of its
// own, so there is no older narrower one to restore.

export const MAIN_SIZE = { width: 1100, height: 720, minWidth: 420 } as const;
