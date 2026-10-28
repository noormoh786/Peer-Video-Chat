'use client';

import { useState } from 'react';
import VideoTile from './VideoTile';
import {
  CheckIcon,
  CopyIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  ShareIcon,
  ShieldIcon,
  SwitchCameraIcon,
  VideoIcon,
  VideoOffIcon,
} from './Icons';

export default function HomeScreen({
  myId,
  socketReady,
  myName,
  onNameChange,
  onStartCall,
  onCopy,
  onShare,
  canShare,
  copied,
  localStream,
  micOn,
  camOn,
  onEnableMedia,
  onReleaseMedia,
  onToggleMic,
  onToggleCam,
  onSwitchCamera,
}) {
  const [targetId, setTargetId] = useState('');
  const hasMedia = Boolean(localStream);
  const canCall = socketReady && targetId.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCall) return;
    onStartCall(targetId);
  };

  return (
    <main className="screen home">
      <div className="glow glow-a" aria-hidden="true" />
      <div className="glow glow-b" aria-hidden="true" />

      <header className="brand">
        <div className="brand-mark" aria-hidden="true">
          <VideoIcon />
        </div>
        <div className="brand-text">
          <h1>Noor Video Chat</h1>
          <p>Peer-to-peer calling, straight from your browser</p>
        </div>
      </header>

      <div className={`status-pill ${socketReady ? 'online' : 'offline'}`}>
        <span className="dot" />
        {socketReady ? 'Connected to server' : 'Connecting to server…'}
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Your call ID</span>
            <p className="hint">Send this to whoever you want to talk to.</p>
          </div>
          {copied ? <span className="chip good">Copied</span> : <span className="chip">Share code</span>}
        </div>

        <p className="id-value" title={myId}>{myId || 'generating…'}</p>

        <div className="row">
          <button type="button" className={`btn ghost ${copied ? 'done' : ''}`} onClick={onCopy} disabled={!myId}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy ID'}
          </button>
          {canShare && (
            <button type="button" className="btn ghost" onClick={onShare} disabled={!myId}>
              <ShareIcon />
              Share
            </button>
          )}
        </div>
      </section>

      <form className="card" onSubmit={handleSubmit}>
        <span className="eyebrow">Start a call</span>

        <label className="field" htmlFor="your-name">
          <span>Your name</span>
          <input
            id="your-name"
            name="your-name"
            type="text"
            value={myName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Noor"
            maxLength={32}
            autoComplete="name"
          />
        </label>

        <label className="field" htmlFor="their-id">
          <span>Their call ID</span>
          <input
            id="their-id"
            name="their-id"
            type="text"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="Paste the ID you received"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
          />
        </label>

        <button type="submit" className="btn primary wide" disabled={!canCall}>
          <PhoneIcon />
          {socketReady ? 'Start call' : 'Waiting for server…'}
        </button>
      </form>

      <section className="card preview-card">
        <div className="card-head">
          <span className="eyebrow">Your camera</span>
          <div className="row tight">
            <button
              type="button"
              className={`icon-btn ${micOn && hasMedia ? '' : 'off'}`}
              onClick={hasMedia ? onToggleMic : onEnableMedia}
              aria-label={micOn && hasMedia ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn && hasMedia ? <MicIcon /> : <MicOffIcon />}
            </button>
            <button
              type="button"
              className={`icon-btn ${camOn && hasMedia ? '' : 'off'}`}
              onClick={hasMedia ? onToggleCam : onEnableMedia}
              aria-label={camOn && hasMedia ? 'Turn camera off' : 'Turn camera on'}
            >
              {camOn && hasMedia ? <VideoIcon /> : <VideoOffIcon />}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onSwitchCamera}
              disabled={!hasMedia}
              aria-label="Switch camera"
            >
              <SwitchCameraIcon />
            </button>
          </div>
        </div>

        <div className="preview-frame">
          {hasMedia && camOn ? (
            <VideoTile stream={localStream} muted mirrored className="preview-video" />
          ) : (
            <div className="preview-empty">
              <div className="avatar sm"><VideoOffIcon /></div>
              <p>{hasMedia ? 'Camera is off' : 'Camera and mic are off'}</p>
              <button type="button" className="btn small" onClick={hasMedia ? onToggleCam : onEnableMedia}>
                {hasMedia ? 'Turn camera on' : 'Enable camera & mic'}
              </button>
            </div>
          )}
        </div>

        {hasMedia && (
          <button type="button" className="link-btn" onClick={onReleaseMedia}>
            Release camera
          </button>
        )}
      </section>

      <footer className="foot">
        <ShieldIcon />
        <span>Calls are peer-to-peer and never stored on a server.</span>
      </footer>
    </main>
  );
}
