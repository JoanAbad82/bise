// Every message between an artifact's frame and the window, by its `bise` kind (architect m_30630):
// the desktop's copy of kit/office/frame.js's FRAME, one list both sides name. Here in shared/ so
// main (guard.ts's injected esc forwarder) and the renderer (artifacts/frameNote.ts, which exports
// it, and the law that checks it equals the kit's) read the same one. Owner: art-desktop.
//
// - anchor: a selection, frame -> window (frameNote.ts readFrame)
// - esc: an esc the page didn't use, frame -> window (guard.ts ESC_FORWARD; ArtifactView.tsx)
// - zoom: {fit}, an image's zoom left or reached fit, frame -> window (useFrameNote.ts claims esc
//   and ⌘0 while fit is false)
// - fit: back to fit, window -> frame (kit/office/image.js)
// - size: {h}, the height that holds the viewer's content, frame -> window (kit/office/video.js;
//   the card hugs it: useFrameNote.ts, designer m_32762)
export const FRAME_KINDS = { anchor: 'anchor', esc: 'esc', zoom: 'zoom', fit: 'fit', size: 'size' } as const;
