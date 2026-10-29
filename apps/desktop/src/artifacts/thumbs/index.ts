// src/artifacts/thumbs: the artifact cards' pictures (art-thumbs, artifacts-in-folders brief part
// 2). art-grid's Card draws the 16:10 frame and its marks; <Thumb item visible /> fills it,
// usePrefetch(items) fills the cache of the rest in the background, thumbExt is the hover's
// extension. The pictures are made by src/main/thumbs. Owner: art-thumbs.
export { Thumb, type ThumbProps } from './Thumb';
export { usePrefetch } from './prefetch';
export { thumbExt } from './plan';
