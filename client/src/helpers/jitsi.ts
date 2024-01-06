export class Jitsi {
  roomName = "webrtchacks";
  fullRoomName = this.roomName;
  // targetNode = document.querySelector("#meet");
  domain = "meet.jit.si";

  connection: any = null;
  isJoined = false;
  room: any = null;

  localTracks: any = [];
  remoteTracks: any = {};
  participantIds = new Set();

  unload() {
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].dispose();
    }
    this.room.leave();
    this.connection.disconnect();
  }

  onConnectionSuccess() {
    const confOptions = {
      enableLayerSuspension: true,
      p2p: {
        enabled: false,
      },
    };
    this.room = this.connection.initJitsiConference(
      this.fullRoomName,
      confOptions
    );
    this.room.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track: any) => {
      if (!track.isLocal()) {
        const participant = track.getParticipantId();

        if (!this.remoteTracks[participant]) {
          this.remoteTracks[participant] = [];
        }
        const idx = this.remoteTracks[participant].push(track);
        const id = participant + track.getType() + idx;
        const remoteVideo = document.createElement("video");
        remoteVideo.autoplay = true;
        remoteVideo.id = `${participant}_video_${id}`;
        track.attach(remoteVideo);
        // this.targetNode.appendChild(remoteVideo);
      }
    });

    this.room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => {
      console.log("conference joined!");
      this.isJoined = true;
      this.localTracks.forEach((track: any) => this.room.addTrack(track));
    });

    this.room.on(JitsiMeetJS.events.conference.USER_JOINED, (id: any) => {
      console.log("user joined");
      this.participantIds.add(id);
      this.room.selectParticipants(Array.from(this.participantIds));
    });
    this.room.on(JitsiMeetJS.events.conference.USER_LEFT, (id: any) => {
      console.log("user left");
      this.participantIds.delete(id);
      this.room.selectParticipants(Array.from(this.participantIds));
    });
    this.room.join();
    this.room.setReceiverVideoConstraint(720);
  }

  init(roomName: string, localVideoElement: HTMLVideoElement): Promise<void> {
    const initOptions = {
      disableAudioLevels: true,
    };

    JitsiMeetJS.init(initOptions);
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

    const domain = "vc.ahaplay.com";
    const options = {
      hosts: {
        domain: domain,
        muc: `conference.${domain}`,
        focus: `focus.${domain}`,
      },
      serviceUrl: `https://${domain}/http-bind?room=${roomName}`,
      clientNode: "http://jitsi.org/jitsimeet",
    };

    this.connection = new JitsiMeetJS.JitsiConnection(null, null, options);

    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess.bind(this)
    );
    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      () => console.log("Connection failed")
    );
    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      () => {
        console.log("disconnect!");

        this.localTracks.forEach((track: any) => track.dispose());
        this.room?.leave();
        this.connection?.disconnect();
      }
    );

    this.connection.connect();

    window.addEventListener("beforeunload", this.unload.bind(this));
    window.addEventListener("unload", this.unload.bind(this));

    return JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] })
      .then((localTracks: any) => {
        this.localTracks = localTracks;
        // const localVideoElem = document.createElement("video");
        // localVideoElem.autoplay = true;
        localTracks.forEach((localTrack: any) => {
          localTrack.attach(localVideoElement);
          // if (this.isJoined) this.room.addTrack(localTrack);
        });
        // targetNode.appendChild(localVideoElem);
      })
      .catch((error: Error) => {
        throw error;
      });
  }
}
