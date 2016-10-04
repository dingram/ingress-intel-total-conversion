declare var plugin: any;

interface IITCPluginManager {
  readonly length: number;
  init(): void;
  push(...plugins: IITCPlugin[]): number;

  toString(): string;
  toLocaleString(): string;
}

interface IITCPlugin {
  (plugin?: any): void;
  info?: {
    script?: {
      version: string,
      name: string,
      description: string,
    },
  };
  legacy?: boolean;
}

interface Window {
  bootPlugins: IITCPlugin[];
  iitc_plugins: IITCPlugin[];
  plugin: any;
}
