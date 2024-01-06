export interface SessionState {
  context: {
    activityResult: {
      key: string;
      value: {
        key: string;
        value: {
          profileId: string;
          ready: boolean;
          value: string;
        };
      };
    }[];
    currentActiveProfiles: string[];
    lastUpdatedTimestamp: Date;
    readyActiveProfiles: string[];
  };
  value: string;
}
