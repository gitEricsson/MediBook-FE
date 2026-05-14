import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { MB } from '@/constants/tokens';
import { Btn } from '@/components/primitives/Btn';
import { Avatar } from '@/components/primitives/Avatar';
import { useVideoCallStore } from '@/store/videoCallStore';

type Track = {
  kind?: string;
  attach?: () => HTMLMediaElement;
};

function TrackView({ track, muted }: { track?: Track; muted?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track || !ref.current) return;
    const element = track.attach?.();
    if (!element) return;
    element.autoplay = true;
    if (element instanceof HTMLVideoElement) element.playsInline = true;
    element.muted = Boolean(muted);
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'cover';
    ref.current.appendChild(element);
    return () => {
      element.remove();
    };
  }, [track, muted]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

function VideoTile({ title, tracks, muted, cameraOff }: { title: string; tracks: Track[]; muted?: boolean; cameraOff?: boolean }) {
  const videoTrack = tracks.find((track) => track.kind === 'video');

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#111827', minHeight: 180, border: '1px solid rgba(255,255,255,0.12)' }}>
      {videoTrack && !cameraOff ? (
        <TrackView track={videoTrack} muted={muted} />
      ) : (
        <div style={{ height: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar name={title} size={72} />
        </div>
      )}
      {tracks.filter((track) => track.kind === 'audio').map((track, index) => (
        <div key={index} style={{ display: 'none' }}>
          <TrackView track={track} muted={muted} />
        </div>
      ))}
      <div style={{ position: 'absolute', left: 10, bottom: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, fontWeight: 600 }}>
        {title}
      </div>
    </div>
  );
}

function useCallDuration(startedAt?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    if (!startedAt) return '00:00';
    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [now, startedAt]);
}

export const VideoRoomModal = memo(function VideoRoomModal() {
  const activeCall = useVideoCallStore((s) => s.activeCall);
  const localTracks = useVideoCallStore((s) => s.localTracks);
  const remoteParticipants = useVideoCallStore((s) => s.remoteParticipants);
  const isMuted = useVideoCallStore((s) => s.isMuted);
  const isCameraOff = useVideoCallStore((s) => s.isCameraOff);
  const isConnecting = useVideoCallStore((s) => s.isConnecting);
  const error = useVideoCallStore((s) => s.error);
  const toggleMicrophone = useVideoCallStore((s) => s.toggleMicrophone);
  const toggleCamera = useVideoCallStore((s) => s.toggleCamera);
  const leaveCall = useVideoCallStore((s) => s.leaveCall);
  const endCall = useVideoCallStore((s) => s.endCall);
  const duration = useCallDuration(activeCall?.startedAt);

  if (!activeCall) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10, 15, 28, 0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ width: 'min(980px, 100%)', maxHeight: '94vh', overflow: 'hidden', borderRadius: 10, background: '#0B1220', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Video consultation</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{activeCall.roomName} · {duration}</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => leaveCall()} style={{ background: '#111827', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            Leave
          </Btn>
        </div>

        {error && (
          <div style={{ margin: 12, padding: 10, background: '#7F1D1D', border: '1px solid #EF4444', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: remoteParticipants.length ? '1fr 1fr' : '1fr', gap: 12, minHeight: 280 }}>
          <VideoTile title="You" tracks={localTracks} muted cameraOff={isCameraOff} />
          {remoteParticipants.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 8, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              {isConnecting ? 'Connecting…' : 'Waiting for the other participant'}
            </div>
          ) : remoteParticipants.map((participant) => (
            <VideoTile key={participant.identity} title={participant.identity.replace('user-', 'User ')} tracks={participant.tracks} />
          ))}
        </div>

        <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0F172A' }}>
          <Btn variant="secondary" size="sm" onClick={toggleMicrophone} style={{ background: isMuted ? '#374151' : MB.bg, color: isMuted ? '#fff' : MB.text }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Btn>
          <Btn variant="secondary" size="sm" onClick={toggleCamera} style={{ background: isCameraOff ? '#374151' : MB.bg, color: isCameraOff ? '#fff' : MB.text }}>
            {isCameraOff ? 'Camera on' : 'Camera off'}
          </Btn>
          <Btn variant="danger" size="sm" onClick={() => endCall()}>
            End call
          </Btn>
        </div>
      </div>
    </div>
  );
});
