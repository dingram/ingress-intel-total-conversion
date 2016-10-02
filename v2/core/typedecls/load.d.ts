declare interface Loader {
  then(...url: string[]) : Loader;
  thenRun(fn: () => void) : Loader;
}

declare function load(...url: string[]) : Loader;
