import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { JitsiContext, JitsiEvents } from "../../contexts/Jitsi";

function formatRemoteTracks(remoteTracks: Record<string, any[]>) {
  return Object.entries(remoteTracks).reduce((acc, [participantId, entry]) => {
    return entry.length > 0
      ? acc.concat({ participantId, tracks: entry })
      : acc;
  }, [] as { participantId: string; tracks: any[] }[]);
}

export function JitsiList(
  props: PropsWithChildren<{ width: number | string; height: number | string }>
) {
  const { width, height } = props;
  const jitsiContext = useContext(JitsiContext);
  const [remoteTracks, setRemoteTracks] = useState<
    { participantId: string; tracks: any[] }[]
  >(formatRemoteTracks(jitsiContext.remoteTracks));

  useEffect(() => {
    function remoteTrackAddedHandler() {
      setRemoteTracks(formatRemoteTracks(jitsiContext.remoteTracks));
    }
    function remoteTrackRemovedHandler() {
      setRemoteTracks(formatRemoteTracks(jitsiContext.remoteTracks));
    }

    jitsiContext.addEventListener(
      JitsiEvents.REMOTE_TRACK_ADDED,
      remoteTrackAddedHandler
    );
    jitsiContext.addEventListener(
      JitsiEvents.REMOTE_TRACK_REMOVED,
      remoteTrackRemovedHandler
    );

    return () => {
      jitsiContext.removeEventListener(
        JitsiEvents.REMOTE_TRACK_ADDED,
        remoteTrackAddedHandler
      );
      jitsiContext.removeEventListener(
        JitsiEvents.REMOTE_TRACK_REMOVED,
        remoteTrackRemovedHandler
      );
    };
  }, [jitsiContext]);

  return (
    <div>
      <video
        playsInline={true}
        disablePictureInPicture={true}
        autoPlay={true}
        width={width}
        height={height}
        ref={(ref) => ref && jitsiContext.attachLocalTracksVideoContainer(ref)}
      ></video>
      {remoteTracks.map(({ participantId }) => (
        <video
          key={participantId}
          ref={(ref) =>
            ref &&
            jitsiContext.attachVideoElementToRemoteTracks(participantId, ref)
          }
          playsInline={true}
          disablePictureInPicture={true}
          autoPlay={true}
          width={width}
          height={height}
        ></video>
      ))}
    </div>
  );
}
