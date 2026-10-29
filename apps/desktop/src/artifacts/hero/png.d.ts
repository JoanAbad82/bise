// The bims stills of the artifacts hero (bims-plugins' renderer, 440x264 at 2x): Vite gives their URL.
declare module '*.png' {
  const url: string;
  export default url;
}
// The pages' banner vignettes (bims-plugins', designer-signed m_42905): 360x176 at 1x, 720x352 at 2x.
declare module '*.webp' {
  const url: string;
  export default url;
}
