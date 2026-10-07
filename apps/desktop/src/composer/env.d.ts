// The build's env as Vite injects it (only the composer's engine switch reads it: Composer.tsx ENGINE).
interface ImportMeta {
  readonly env: Readonly<Record<string, string | undefined>>;
}
