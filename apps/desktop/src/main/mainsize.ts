// The main window's size (ambient m_11427, lead m_11455: final). Pure.
// Narrowest: 680 px = the sidebar (264) + one 380 px column + margins, the
// sidebar never folds, so a narrow window never leaves a column where nothing
// fits. Electron keeps every frame at or above it (a drag, setBounds); main
// saves no frame of its own, so there is no older narrower one to restore.

export const MAIN_SIZE = { width: 1100, height: 720, minWidth: 680 } as const;
