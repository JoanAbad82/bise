// The bims stills of the artifacts hero (bims-plugins' renderer, 440x264 at 2x): Vite gives their URL.
declare module '*.png' {
  const url: string;
  export default url;
}
