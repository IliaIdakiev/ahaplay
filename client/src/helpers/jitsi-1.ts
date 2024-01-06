const options = {
  hosts: {
    domain: "vc.ahaplay.com",
    muc: "conference.vc.ahaplay.com",
  },
  serviceUrl: `https://vc.ahaplay.com/http-bind`,
  bridgeChannel: {},
  testing: {},
  enableNoAudioDetection: true,
  enableNoisyMicDetection: true,
  channelLastN: -1,
  p2p: {
    enabled: true,
    stunServers: [
      {
        urls: "stun:meet-jit-si-turnrelay.jitsi.net:443",
      },
    ],
  },
  analytics: {},
  mouseMoveCallbackInterval: 1000,
  flags: {
    sourceNameSignaling: true,
    sendMultipleVideoStreams: true,
    receiveMultipleVideoStreams: true,
  },
  toolbarConfig: {},
  // defaultLogoUrl: "images/watermark.svg",
  welcomePage: {},
  prejoinConfig: {},
  disabledSounds: [],
  e2ee: {},
  defaultLocalDisplayName: "me",
  defaultRemoteDisplayName: "Fellow Jitster",
  transcription: {},
  recordingService: {},
  liveStreaming: {},
  speakerStats: {},
};

const confOptions = {};

export class Jitsi {
  connection: any = null;
  isJoined = false;
  isVideo = true;
  room: any = null;

  localTracks: any[] = [];
  remoteTracks: any = {};

  /**
   * Handles local tracks.
   * @param tracks Array with JitsiTrack objects
   */
  onLocalTracks(tracks: any[]) {
    this.localTracks = tracks;
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        (audioLevel: any) => console.log(`Audio Level local: ${audioLevel}`)
      );
      this.localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log("local track muted")
      );
      this.localTracks[i].addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log("local track stoped")
      );
      this.localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        (deviceId: any) =>
          console.log(`track audio output device was changed to ${deviceId}`)
      );
      if (this.localTracks[i].getType() === "video") {
        // $('body').append(`<video autoplay='1' id='localVideo${i}' />`);
        // this.localTracks[i].attach($(`#localVideo${i}`)[0]);
      } else {
        // $('body').append(
        //     `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
        // this.localTracks[i].attach($(`#localAudio${i}`)[0]);
      }
      if (this.isJoined) {
        this.room.addTrack(this.localTracks[i]);
      }
    }
  }

  /**
   * Handles remote tracks
   * @param track JitsiTrack object
   */
  onRemoteTrack(track: any) {
    if (track.isLocal()) {
      return;
    }
    const participant = track.getParticipantId();

    if (!this.remoteTracks[participant]) {
      this.remoteTracks[participant] = [];
    }
    const idx = this.remoteTracks[participant].push(track);

    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      (audioLevel: any) => console.log(`Audio Level remote: ${audioLevel}`)
    );
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () =>
      console.log("remote track muted")
    );
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () =>
      console.log("remote track stoped")
    );
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      (deviceId: any) =>
        console.log(`track audio output device was changed to ${deviceId}`)
    );
    const id = participant + track.getType() + idx;

    if (track.getType() === "video") {
      // $('body').append(
      //     `<video autoplay='1' id='${participant}video${idx}' />`);
    } else {
      // $('body').append(
      //     `<audio autoplay='1' id='${participant}audio${idx}' />`);
    }
    // track.attach($(`#${id}`)[0]);
  }

  /**
   * That function is executed when the conference is joined
   */
  onConferenceJoined() {
    console.log("conference joined!");
    this.isJoined = true;
    for (let i = 0; i < this.localTracks.length; i++) {
      this.room.addTrack(this.localTracks[i]);
    }
  }

  /**
   *
   * @param id
   */
  onUserLeft(id: any) {
    console.log("user left");
    if (!this.remoteTracks[id]) {
      return;
    }
    const tracks = this.remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
      // tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
  }

  /**
   * That function is called when connection is established successfully
   */
  onConnectionSuccess() {
    this.room = this.connection.initJitsiConference("conference", confOptions); // I assume that conference is the room name
    this.room.on(
      JitsiMeetJS.events.conference.TRACK_ADDED,
      this.onRemoteTrack.bind(this)
    );
    this.room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track: any) => {
      console.log(`track removed!!!${track}`);
    });
    this.room.on(
      JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      this.onConferenceJoined.bind(this)
    );
    this.room.on(JitsiMeetJS.events.conference.USER_JOINED, (id: any) => {
      console.log("user join");
      this.remoteTracks[id] = [];
    });
    this.room.on(
      JitsiMeetJS.events.conference.USER_LEFT,
      this.onUserLeft.bind(this)
    );
    this.room.on(
      JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED,
      (track: any) => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
      }
    );
    this.room.on(
      JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
      (userID: any, displayName: any) =>
        console.log(`${userID} - ${displayName}`)
    );
    this.room.on(
      JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      (userID: any, audioLevel: any) => console.log(`${userID} - ${audioLevel}`)
    );
    this.room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () =>
      console.log(`${this.room.getPhoneNumber()} - ${this.room.getPhonePin()}`)
    );
    this.room.join();
  }
  /**
   * This function is called when the connection fail.
   */
  onConnectionFailed() {
    console.error("Connection Failed!");
  }
  /**
   * This function is called when the connection fail.
   */
  onDeviceListChanged(devices: any) {
    console.info("current devices", devices);
  }

  /**
   * This function is called when we disconnect.
   */
  disconnect() {
    console.log("disconnect!");
    this.connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess
    );
    this.connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed
    );
    this.connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.disconnect
    );
  }

  unload() {
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].dispose();
    }
    this.room.leave();
    this.connection.disconnect();
  }

  switchVideo() {
    this.isVideo = !this.isVideo;
    if (this.localTracks[1]) {
      this.localTracks[1].dispose();
      this.localTracks.pop();
    }

    JitsiMeetJS.createLocalTracks({
      devices: [this.isVideo ? "video" : "desktop"],
    })
      .then((tracks: any) => {
        this.localTracks.push(tracks[0]);
        this.localTracks[1].addEventListener(
          JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
          () => console.log("local track muted")
        );
        this.localTracks[1].addEventListener(
          JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
          () => console.log("local track stoped")
        );
        // this.localTracks[1].attach($("#localVideo1")[0]);
        this.room.addTrack(this.localTracks[1]);
      })
      .catch((error: Error) => console.log(error));
  }
  /**
   *
   * @param selected
   */
  changeAudioOutput(selected: any) {
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
  }

  init() {
    const initOptions = {
      disableAudioLevels: true,
    };
    JitsiMeetJS.init(initOptions);

    this.connection = new JitsiMeetJS.JitsiConnection(null, null, options);

    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess.bind(this)
    );
    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed.bind(this)
    );
    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.disconnect.bind(this)
    );

    JitsiMeetJS.mediaDevices.addEventListener(
      JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
      this.onDeviceListChanged.bind(this)
    );

    this.connection.connect();

    JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] })
      .then(this.onLocalTracks.bind(this))
      .catch((error: any) => {
        throw error;
      });

    if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable("output")) {
      JitsiMeetJS.mediaDevices.enumerateDevices((devices: any) => {
        const audioOutputDevices = devices.filter(
          (d: any) => d.kind === "audiooutput"
        );

        if (audioOutputDevices.length > 1) {
          // $("#audioOutputSelect").html(
          //   audioOutputDevices
          //     .map((d) => `<option value="${d.deviceId}">${d.label}</option>`)
          //     .join("\n")
          // );
          // $("#audioOutputSelectWrapper").show();
        }
      });

      window.addEventListener("beforeunload", this.unload.bind(this));
      window.addEventListener("unload", this.unload.bind(this));

      // JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    }
  }
}
