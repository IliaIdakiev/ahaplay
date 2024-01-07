import { PropsWithChildren, createContext } from "react";

const domain = "vc.ahaplay.com";
const options = {
  hosts: {
    domain: domain,
    muc: `conference.${domain}`,
    focus: `focus.${domain}`,
  },
  serviceUrl: `https://${domain}/http-bind`,
  clientNode: "http://jitsi.org/jitsimeet",
};
const confOptions = {
  enableLayerSuspension: true,
  p2p: {
    enabled: false,
  },
};

export enum JitsiEvents {
  CONNECTION_SUCCESS = "CONNECTION_SUCCESS",
  CONNECTION_FAILURE = "CONNECTION_FAILURE",
  READY = "READY",
  REMOTE_TRACK_ADDED = "REMOTE_TRACK_ADDED",
  REMOTE_TRACK_REMOVED = "REMOTE_TRACK_REMOVED",
}

export type AvailableSources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};

class Jitsi extends EventTarget {
  localTrackVideoElement: HTMLVideoElement | null = null;
  connection: any = null;
  roomName = "";
  localTracks: any[] = [];
  remoteTracks: Record<string, any[]> = {};
  conference: any;

  emit(event: JitsiEvents) {
    this.dispatchEvent(new Event(event));
  }

  init(localTrackVideoElement: HTMLVideoElement, roomName: string) {
    if (this.connection) return console.log("Jitsi already initialized!");
    this.roomName = roomName;
    this.localTrackVideoElement = localTrackVideoElement;

    JitsiMeetJS.init();
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

    this.connection = new JitsiMeetJS.JitsiConnection(null, null, options);

    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess.bind(this)
    );

    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed.bind(this)
    );
    this.connection.connect();
  }

  onConnectionSuccess() {
    this.emit(JitsiEvents.CONNECTION_SUCCESS);
    this.conference = this.connection.initJitsiConference(
      this.roomName,
      confOptions
    );

    this.conference.on(
      JitsiMeetJS.events.conference.TRACK_ADDED,
      this.onTrackAdded.bind(this)
    );
    this.conference.on(
      JitsiMeetJS.events.conference.TRACK_REMOVED,
      this.onTrackRemoved.bind(this)
    );

    this.conference.join();

    JitsiMeetJS.createLocalTracks({ devices: ["video", "audio"] }).then(
      (tracks: any) => {
        for (const track of tracks) {
          this.conference.addTrack(track);
        }
        this.localTracks = tracks;
        this.emit(JitsiEvents.READY);
      }
    );
  }

  muteAudio() {
    const audioTrack = this.localTracks.find((t) => t.getType() === "audio");
    audioTrack?.mute();
  }

  changeSource(type: "audio" | "video", deviceId: string): Promise<any> {
    const localTrack = this.localTracks.find(
      (track) => track.getType() === type
    );
    this.localTracks = this.localTracks.filter((t) => t !== localTrack);
    this.conference?.removeTrack(localTrack);
    const idConfigKey = type === "audio" ? "micDeviceId" : "cameraDeviceId";

    return JitsiMeetJS.createLocalTracks({
      devices: [type],
      [idConfigKey]: deviceId,
    }).then((tracks: any) => {
      const track = tracks[0];
      this.localTracks = this.localTracks.concat(track);
      this.conference?.addTrack(track);
      return track;
    });
  }

  onConnectionFailed() {
    this.emit(JitsiEvents.CONNECTION_FAILURE);
  }

  attachVideoElementToRemoteTracks(
    participantId: any,
    remoteTrackVideoElement: HTMLVideoElement
  ) {
    const participantTracks = this.remoteTracks[participantId];
    if (!participantTracks || participantTracks.length === 0) return;
    for (const track of participantTracks) {
      const previousContainer = track.containers[0];
      if (previousContainer) track.detach(previousContainer);
      track.attach(remoteTrackVideoElement);
    }
  }

  onTrackAdded(track: any) {
    if (track.isLocal()) {
      this.localTracks = this.localTracks.concat(track);
      track.attach(this.localTrackVideoElement);
    } else {
      const participant = track.getParticipantId();
      this.remoteTracks[participant] = (
        this.remoteTracks[participant] || []
      ).concat(track);
      this.emit(JitsiEvents.REMOTE_TRACK_ADDED);
    }
  }

  detachLocalTracksVideoContainer(localTrackVideoElement?: HTMLVideoElement) {
    for (const localTrack of this.localTracks) {
      const container = localTrackVideoElement || localTrack.containers[0];
      if (container) localTrack.detach(container);
    }
  }

  attachLocalTracksVideoContainer(localTrackVideoElement: HTMLVideoElement) {
    for (const localTrack of this.localTracks) {
      const previousContainer = localTrack.containers[0];
      if (previousContainer) localTrack.detach(previousContainer);
      localTrack.attach(localTrackVideoElement);
    }
  }

  onTrackRemoved(track: any) {
    if (track.isLocal()) {
      this.localTracks = this.localTracks.filter((t) => t !== track);
      track.detach(this.localTrackVideoElement);
    } else {
      const participant = track.getParticipantId();
      this.remoteTracks[participant] = (
        this.remoteTracks[participant] || []
      ).filter((t) => t !== track);
      this.emit(JitsiEvents.REMOTE_TRACK_REMOVED);
    }
  }

  detachLocalVideoElement() {
    for (const track of this.localTracks) {
      track.detach(this.localTrackVideoElement);
    }
    this.localTrackVideoElement = null;
  }

  attachLocalVideoElement(newLocalVideoElement: HTMLVideoElement) {
    for (const track of this.localTracks) {
      track.attach(newLocalVideoElement);
    }
    this.localTrackVideoElement = newLocalVideoElement;
  }

  getAvailableSources(): Promise<AvailableSources> {
    return navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        return devices.reduce(
          (acc, device) => {
            if (device.kind === "audioinput") {
              acc.audio.push(device);
            } else if (device.kind === "videoinput") {
              acc.video.push(device);
            }
            return acc;
          },
          { audio: [], video: [] } as AvailableSources
        );
      })
      .catch(() => ({ audio: [], video: [] } as AvailableSources));
  }

  getLocalAudioTrack() {
    return this.localTracks.find((t) => t.getType() === "audio");
  }
  getLocalVideoTrack() {
    return this.localTracks.find((t) => t.getType() === "video");
  }
}

export const JitsiContext = createContext<Jitsi>({} as any);

export const JitsiContextProvider = (props: PropsWithChildren) => {
  return (
    <JitsiContext.Provider value={new Jitsi()}>
      {props.children}
    </JitsiContext.Provider>
  );
};
