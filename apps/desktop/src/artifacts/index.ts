// src/artifacts: what his agents made (desktop-screens v6; bise fait mac: the page, and ArtLibrary for the
// window's sidebar, library.tsx). Owner: nm-pages-a (amb-kit's before).
export { ArtifactsScreen } from './Screen';
export { ArtifactOpen, ArtifactVersions, versionUrl, type ArtifactOpenProps } from './Open';
export { aboutWords, useAboutWords, useArtifactMaker, type AboutWords } from './maker';
export { ArtifactList, ArtifactRows, ListHead, ListRow } from './List';
export { ArtifactGrid, type GridProps } from './Grid';
export { ArtCard, CardPic, type PickHow } from './Card';
export { StackSheet, type SheetProps } from './Sheet';
export { useCols, useGridKeys, type GridKeys, type GridKeysOpts, type View } from './gridKeys';
export * from './gallery';
export { useAllArtifacts, useNewArtifacts } from './hooks';
export { usePlaceCrumb } from './crumb';
export { ArtLibrary } from './library';
export { PageVignette, useBannerGutter, type VignettePage } from './hero/vignettes';
export { LiveVignette } from './hero/Live';
export * from './model';
