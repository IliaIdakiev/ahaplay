export interface JitsiMeetJS {
  init(options?: any): void;
  JitsiConnection: {
    new (...args: any[]): any;
  };
  createLocalTracks: any;
  events: any;
  mediaDevices: any;
  logLevels: any;
  setLogLevel(logLevel: any): void;
  getActiveAudioDevice(): Promise<MediaDeviceInfo[]>;
}
