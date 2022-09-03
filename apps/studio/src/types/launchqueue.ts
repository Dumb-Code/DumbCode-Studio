declare global {
  interface Window { readonly launchQueue?: LaunchQueue; }
  interface LaunchQueue {
    setConsumer(consumer: (params: LaunchParams) => void): void;
  }
  interface LaunchParams {
    readonly files: FileSystemFileHandle[];
  }
}

export { };
