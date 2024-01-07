import {
  ChangeEvent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  SyntheticEvent,
} from "react";
import { JitsiContext, JitsiEvents } from "../../contexts/Jitsi";
import { VideoPreview } from "./VideoPreview";
import { NoAccessToDevices } from "./NoAccessToDevices";
import { DeviceData } from "./types";

export function JitsiSetup(
  props: PropsWithChildren<{
    sessionId: string;
    setupCompletedHandler: () => void;
  }>
) {
  const { sessionId, setupCompletedHandler } = props;
  const [hasGrantedAccess, setHasGrantedAccess] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAudioDevice, setSelectedAudioDevice] =
    useState<DeviceData | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] =
    useState<DeviceData | null>(null);

  const [connectionFailed, setConnectionFailed] = useState(false);
  const [availableSources, setAvailableSources] = useState({
    audio: [] as MediaDeviceInfo[],
    video: [] as MediaDeviceInfo[],
  });
  const jitsiContext = useContext(JitsiContext);
  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);

  const syncSelectedDevices = useCallback(
    (data?: { audio?: any; video?: any }) => {
      const audioTrack = data?.audio || jitsiContext.getLocalAudioTrack();
      const videoTrack = data?.video || jitsiContext.getLocalVideoTrack();

      setSelectedAudioDevice({
        deviceId: audioTrack.track.id,
        label: audioTrack.track.label,
        isMuted: audioTrack.isMuted(),
      });
      setSelectedVideoDevice({
        deviceId: videoTrack.track.id,
        label: videoTrack.track.label,
        isMuted: videoTrack.isMuted(),
      });
    },
    [jitsiContext]
  );

  const audioDeviceChangeHandler = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      jitsiContext.changeSource("audio", event.target.value).then((track) => {
        syncSelectedDevices({ audio: track });
      });
    },
    [jitsiContext, syncSelectedDevices]
  );
  const videoDeviceChangeHandler = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      jitsiContext.changeSource("video", event.target.value).then((track) => {
        syncSelectedDevices({ video: track });
      });
    },
    [jitsiContext, syncSelectedDevices]
  );

  const toggleAudioHandler = useCallback(
    (event: SyntheticEvent<any>) => {
      const audioTrack = jitsiContext.getLocalAudioTrack();
      (audioTrack.isMuted() ? audioTrack.unmute() : audioTrack.mute()).then(
        () => syncSelectedDevices({ audio: audioTrack })
      );
    },
    [jitsiContext, syncSelectedDevices]
  );

  const toggleVideoHandler = useCallback(
    (event: SyntheticEvent<any>) => {
      const videoTrack = jitsiContext.getLocalVideoTrack();
      (videoTrack.isMuted() ? videoTrack.unmute() : videoTrack.mute()).then(
        () => syncSelectedDevices({ video: videoTrack })
      );
    },
    [jitsiContext, syncSelectedDevices]
  );

  useEffect(() => {
    if (localVideoElementRef.current === null || jitsiContext.connection)
      return;

    const jitsiConnectedCallback = () => {
      setIsConnected(true);
      jitsiContext.removeEventListener(
        JitsiEvents.CONNECTION_SUCCESS,
        jitsiConnectedCallback
      );
    };
    const jitsiConnectionFailedCallback = () => {
      setConnectionFailed(true);
      jitsiContext.removeEventListener(
        JitsiEvents.CONNECTION_FAILURE,
        jitsiConnectionFailedCallback
      );
    };

    const jitsiReadyCallback = () => {
      syncSelectedDevices();
      setHasGrantedAccess(true);
      jitsiContext.getAvailableSources().then((availableSources) => {
        setAvailableSources(availableSources);
      });
      jitsiContext.removeEventListener(JitsiEvents.READY, jitsiReadyCallback);
    };

    jitsiContext.addEventListener(
      JitsiEvents.CONNECTION_SUCCESS,
      jitsiConnectedCallback
    );

    jitsiContext.addEventListener(
      JitsiEvents.CONNECTION_FAILURE,
      jitsiConnectionFailedCallback
    );

    jitsiContext.addEventListener(JitsiEvents.READY, jitsiReadyCallback);

    jitsiContext.init(localVideoElementRef.current, sessionId);
    const videoElement = localVideoElementRef.current;
    return () => {
      jitsiContext.detachLocalTracksVideoContainer(videoElement);
    };
  }, [hasGrantedAccess, jitsiContext, sessionId, syncSelectedDevices]);

  return (
    <>
      {hasGrantedAccess && !isConnected && <div>Connecting...</div>}
      <VideoPreview
        width={300}
        height={300}
        selectedAudioDevice={selectedAudioDevice}
        selectedVideoDevice={selectedVideoDevice}
        hideConfigurations={!hasGrantedAccess}
        localVideoElementRef={localVideoElementRef}
        availableSources={availableSources}
        audioDeviceChangeHandler={audioDeviceChangeHandler}
        videoDeviceChangeHandler={videoDeviceChangeHandler}
        toggleAudioHandler={toggleAudioHandler}
        toggleVideoHandler={toggleVideoHandler}
      />
      {!hasGrantedAccess && <NoAccessToDevices />}
      {hasGrantedAccess && (
        <button onClick={setupCompletedHandler}>Continue</button>
      )}
    </>
  );
}
