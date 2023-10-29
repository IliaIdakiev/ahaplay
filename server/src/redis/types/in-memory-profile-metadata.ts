export interface InMemoryProfileMetadata {
  profileId: string;
  isActive: boolean;
  state: string;
  startEmotion: number | null;
  endEmotion: number | null;
  lastUpdateTimestamp: number;
}
