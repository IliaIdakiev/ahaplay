export interface SessionStateGraphQL {
  value: string;
  context: {
    currentActiveProfiles: string[];
    readyActiveProfiles: string[];
    activityResult: {
      key: string;
      value: {
        key: string;
        value: { profileId: String; value: String; ready: Boolean }[];
      }[];
    }[];
    lastUpdatedTimestamp: Number;
  };
}
