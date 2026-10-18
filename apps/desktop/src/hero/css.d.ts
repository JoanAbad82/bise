// CSS imported whole as a string by the bundler (Vite's `?inline`): hero.ts puts it in a <style>.
declare module '*.css?inline' {
  const css: string;
  export default css;
}
