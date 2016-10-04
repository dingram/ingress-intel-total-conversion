declare var plugin: any;

interface IITCPlugin {
  (plugin?: any): void;
  info?: {
    script?: {
      version: string,
      name: string,
      description: string,
    },
  };
}

interface Window {
  plugin: any;
  iitc_plugins: ((plugin?: any) => void)[];
}
