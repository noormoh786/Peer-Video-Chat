'use client';

import { useCallback, useRef, useState } from 'react';
import VideoTile from './VideoTile';
import { formatDuration, connectionLabel } from '../lib/webrtc';
import {
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
  SwitchCameraIcon,
  VideoIcon,
  VideoOffIcon,
} from './Icons';

export default function CallScreen({
  status,
  peerName,
  peerId,
  initials,
  remoteStream,
  localStream,
  micOn,
  camOn,
  connState,
  elapsed,
  onToggleMic,
  onToggleCam,
  onSwitchCamera,
  onHangUp,
}) {
  const [audioBlocked, setAudioBlocked] = useState(false);
  const remoteVideoRef = useRef(null);
  const handleBlockedChange = useCallback((blocked) => setAudioBlocked(blocked), []);

  // Mobile browsers refuse unmuted autoplay until the user taps; this retries
  // playback inside a real gesture.
  const enableSound = useCallback(async () => {
    const element = remoteVideoRef.current;
    if (!element) return;
    try {
      await element.play();
      setAudioBlocked(false);
    } catch {
      /* still blocked — keep the hint visible */
    }
  }, []);

  const isOutgoing = status === 'outgoing';
  const connection = connectionLabel(connState);
  const label = peerName?.trim() || (isOutgoing ? 'Calling…' : 'Connected peer');
  const sublabel = isOutgoing && !remoteStream ? 'Ringing' : formatDuration(elapsed);

  return (
    <main className="screen call">
      <div className="stage">
        {remoteStream ? (
          <VideoTile
            stream={remoteStream}
            className="remote-video"
            videoRef={remoteVideoRef}
            onBlockedChange={handleBlockedChange}
          />
        ) : (
          <div className="stage-empty">
            <div className={`avatar lg ${isOutgoing ? 'pulse' : ''}`}>{initials}</div>
            <h2>{label}</h2>
            <p className="mono">{peerId}</p>
            <p className="muted">{isOutgoing ? 'Waiting for them to answer…' : 'Connecting video…'}</p>
          </div>
        )}
      </div>

      <header className="call-top">
        <div className="call-peer">
          <span className="avatar xs">{initials}</span>
          <div>
            <strong>{label}</strong>
            <span className="sub">{sublabel}</span>
          </div>
        </div>
        <span className={`conn tone-${connection.tone}`}>
          <span className="dot" />
          {connection.text}
        </span>
      </header>

      {audioBlocked && (
        <button type="button" className="audio-hint" onClick={enableSound}>
          Tap to enable sound
        </button>
      )}

      {localStream && (
        <div className={`pip ${camOn ? '' : 'pip-off'}`}>
          {camOn ? (
            <VideoTile stream={localStream} muted mirrored className="pip-video" />
          ) : (
            <div className="pip-empty"><VideoOffIcon /></div>
          )}
        </div>
      )}

      <div className="controls">
        <button
          type="button"
          className={`ctl ${micOn ? '' : 'off'}`}
          onClick={onToggleMic}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <MicIcon /> : <MicOffIcon />}
          <span>{micOn ? 'Mic' : 'Muted'}</span>
        </button>

        <button
          type="button"
          className={`ctl ${camOn ? '' : 'off'}`}
          onClick={onToggleCam}
          aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {camOn ? <VideoIcon /> : <VideoOffIcon />}
          <span>{camOn ? 'Camera' : 'Off'}</span>
        </button>

        <button type="button" className="ctl" onClick={onSwitchCamera} aria-label="Switch camera">
          <SwitchCameraIcon />
          <span>Flip</span>
        </button>

        <button type="button" className="ctl hangup" onClick={onHangUp} aria-label="End call">
          <PhoneOffIcon />
          <span>End</span>
        </button>
      </div>
    </main>
  );
}
