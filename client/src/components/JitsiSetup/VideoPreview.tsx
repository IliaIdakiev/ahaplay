import {
  MutableRefObject,
  PropsWithChildren,
  useMemo,
  MouseEventHandler,
  useState,
  useCallback,
  useEffect,
} from "react";
import { AvailableSources } from "../../contexts/Jitsi";
import { DeviceData } from "./types";

export function VideoPreview(
  props: PropsWithChildren<{
    width: number | string;
    height: number | string;
    hideConfigurations?: boolean;
    localVideoElementRef: MutableRefObject<HTMLVideoElement | null>;
    availableSources: AvailableSources;
    audioDeviceChangeHandler: React.ChangeEventHandler<HTMLSelectElement>;
    videoDeviceChangeHandler: React.ChangeEventHandler<HTMLSelectElement>;
    selectedAudioDevice: DeviceData | null;
    selectedVideoDevice: DeviceData | null;
    toggleAudioHandler: MouseEventHandler<HTMLButtonElement>;
    toggleVideoHandler: MouseEventHandler<HTMLButtonElement>;
  }>
) {
  const {
    width,
    height,
    hideConfigurations,
    localVideoElementRef,
    availableSources,
    selectedAudioDevice,
    selectedVideoDevice,
    audioDeviceChangeHandler,
    videoDeviceChangeHandler,
    toggleAudioHandler: toggleAudio,
    toggleVideoHandler: toggleVideo,
  } = props;

  const [actualVideoToggleValue, setActualVideoToggleValue] = useState(
    selectedVideoDevice?.isMuted
  );
  const [actualAudioToggleValue, setActualAudioToggleValue] = useState(
    selectedAudioDevice?.isMuted
  );

  useEffect(() => {
    setActualVideoToggleValue(selectedVideoDevice?.isMuted);
  }, [selectedVideoDevice?.isMuted]);
  useEffect(() => {
    setActualAudioToggleValue(selectedAudioDevice?.isMuted);
  }, [selectedAudioDevice?.isMuted]);

  const validAudioDevices: DeviceData[] = useMemo(() => {
    let devices: DeviceData[] = availableSources.audio.map((d) => ({
      label: d.label,
      deviceId: d.deviceId,
    }));
    if (
      selectedAudioDevice &&
      !availableSources.audio.find((a) => a.label === selectedAudioDevice.label)
    ) {
      devices = [selectedAudioDevice].concat(devices);
    }
    return devices.filter((v) => !!v.label);
  }, [availableSources.audio, selectedAudioDevice]);

  const validVideoDevices: DeviceData[] = useMemo(() => {
    let devices: DeviceData[] = availableSources.video.map((d) => ({
      label: d.label,
      deviceId: d.deviceId,
    }));
    if (
      selectedVideoDevice &&
      !availableSources.video.find((a) => a.label === selectedVideoDevice.label)
    ) {
      devices = [selectedVideoDevice].concat(devices);
    }
    return devices.filter((v) => !!v.label);
  }, [availableSources.video, selectedVideoDevice]);

  const selectedAudioDeviceFromList = useMemo(() => {
    const data = validAudioDevices.find(
      (d) => d.label === selectedAudioDevice?.label
    );
    return data ? { ...data, isMuted: !!selectedAudioDevice?.isMuted } : null;
  }, [
    selectedAudioDevice?.isMuted,
    selectedAudioDevice?.label,
    validAudioDevices,
  ]);

  const selectedVideoDeviceFromList = useMemo(() => {
    const data = validVideoDevices.find(
      (d) => d.label === selectedVideoDevice?.label
    );
    return data ? { ...data, isMuted: !!selectedVideoDevice?.isMuted } : null;
  }, [
    selectedVideoDevice?.isMuted,
    selectedVideoDevice?.label,
    validVideoDevices,
  ]);

  const videoToggleHandlerWithDisable = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      setActualVideoToggleValue(!selectedVideoDeviceFromList?.isMuted);
      toggleVideo(event);
    },
    [selectedVideoDeviceFromList?.isMuted, toggleVideo]
  );

  const audioToggleHandlerWithDisable = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      setActualAudioToggleValue(!selectedAudioDeviceFromList?.isMuted);
      toggleAudio(event);
    },
    [selectedAudioDeviceFromList?.isMuted, toggleAudio]
  );

  return (
    <>
      <video
        playsInline={true}
        disablePictureInPicture={true}
        autoPlay={true}
        width={width}
        height={height}
        ref={localVideoElementRef}
      ></video>
      {!hideConfigurations && (
        <>
          <div id="actions">
            <button
              onClick={videoToggleHandlerWithDisable}
              disabled={
                actualVideoToggleValue !== selectedVideoDeviceFromList?.isMuted
              }
            >
              {selectedVideoDeviceFromList?.isMuted
                ? "Show video"
                : "Hide video"}
            </button>
            <button
              onClick={audioToggleHandlerWithDisable}
              disabled={
                actualAudioToggleValue !== selectedAudioDeviceFromList?.isMuted
              }
            >
              {selectedAudioDeviceFromList?.isMuted
                ? "Unmute audio"
                : "Mute audio"}
            </button>
          </div>
          <div id="sources">
            {validAudioDevices.length > 0 && (
              <div>
                <h6>Audio sources</h6>
                <select
                  onChange={audioDeviceChangeHandler}
                  value={selectedAudioDeviceFromList?.deviceId}
                >
                  {validAudioDevices.map((source) => (
                    <option
                      key={"audio-" + source.deviceId}
                      value={source.deviceId}
                    >
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {validVideoDevices.length > 0 && (
              <div>
                <h6>Video sources</h6>
                <select
                  onChange={videoDeviceChangeHandler}
                  value={selectedVideoDeviceFromList?.deviceId}
                >
                  {validVideoDevices.map((source) => (
                    <option
                      key={"video-" + source.deviceId}
                      value={source.deviceId}
                    >
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
