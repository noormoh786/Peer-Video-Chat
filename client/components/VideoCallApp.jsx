'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import HomeScreen from './HomeScreen';
import CallScreen from './CallScreen';
import IncomingCallOverlay from './IncomingCallOverlay';
import { getSocketUrl } from '../lib/config';
import { copyText, shareText, canShare } from '../lib/clipboard';
import { addStreamTracks, createPeerConnection, getMedia, stopStream } from '../lib/webrtc';

const NAME_KEY = 'pvc:name';

function mediaErrorMessage(error) {
  if (!error) return 'Could not reach your camera or microphone.';
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Camera access needs https or localhost. Open this app using https:// or localhost.';
  }
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera and microphone permission was blocked. Allow it in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera or microphone was found on this device.';
    case 'NotReadableError':
      return 'Your camera is busy in another app or tab. Close it and try again.';
    default:
      return `Could not open your camera or microphone (${error.name || 'unknown error'}).`;
  }
}

function initialsOf(value) {
  const text = (value || '').trim();
  if (!text) return '?';
  return text.slice(0, 2).toUpperCase();
}

export default function VideoCallApp() {
  const [myId, setMyId] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const [myName, setMyName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | outgoing | incoming | active
  const [peer, setPeer] = useState({ name: '', id: '' });
  const [connState, setConnState] = useState('new');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notice, setNotice] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  // Resolved after mount: the server has no navigator, so rendering this
  // during SSR would produce a hydration mismatch.
  const [shareSupported, setShareSupported] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteIdRef = useRef(null);
  const iceBufferRef = useRef([]);
  const pendingCallerRef = useRef(null);
  const statusRef = useRef('idle');
  const micOnRef = useRef(true);
  const camOnRef = useRef(true);
  const nameRef = useRef('');
  const noticeTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);

  const showNotice = useCallback((text, tone = 'info') => {
    setNotice({ text, tone });
    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3600);
  }, []);

  const setPhase = useCallback((next) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  /* ---------------------------------------------------------------- peers */

  const setupPeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    pcRef.current = createPeerConnection({
      onIceCandidate: (candidate) => {
        const to = remoteIdRef.current;
        if (to && socketRef.current) socketRef.current.emit('icecandidate', { to, candidate });
      },
      onTrack: (stream) => setRemoteStream(stream),
      onConnectionStateChange: (state) => setConnState(state),
    });
    return pcRef.current;
  }, []);

  const applyRemoteIce = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription?.type) {
      iceBufferRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      /* already applied — safe to ignore */
    }
  }, []);

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription?.type) return;
    const queued = iceBufferRef.current;
    iceBufferRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* already applied — safe to ignore */
      }
    }
  }, []);

  const teardown = useCallback(
    (message, tone) => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      iceBufferRef.current = [];
      pendingCallerRef.current = null;
      remoteIdRef.current = null;
      setRemoteStream(null);
      setPeer({ name: '', id: '' });
      setConnState('new');
      setElapsed(0);
      setPhase('idle');
      if (message) showNotice(message, tone);
    },
    [setPhase, showNotice],
  );

  /* ---------------------------------------------------------------- media */

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await getMedia();
    stream.getAudioTracks().forEach((track) => {
      track.enabled = micOnRef.current;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = camOnRef.current;
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const enableMedia = useCallback(async () => {
    try {
      await ensureLocalStream();
    } catch (error) {
      showNotice(mediaErrorMessage(error), 'bad');
    }
  }, [ensureLocalStream, showNotice]);

  const releaseMedia = useCallback(() => {
    if (statusRef.current !== 'idle') return;
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    micOnRef.current = true;
    camOnRef.current = true;
    setMicOn(true);
    setCamOn(true);
  }, []);

  const toggleMic = useCallback(() => {
    const next = !micOnRef.current;
    micOnRef.current = next;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    const next = !camOnRef.current;
    camOnRef.current = next;
    setCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
  }, []);

  const switchCamera = useCallback(async () => {
    const current = localStreamRef.current;
    if (!current) return;
    const inputs = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === 'videoinput',
    );
    if (inputs.length < 2) {
      showNotice('Only one camera is available on this device.', 'muted');
      return;
    }
    const activeId = current.getVideoTracks()[0]?.getSettings().deviceId;
    const index = inputs.findIndex((device) => device.deviceId === activeId);
    const nextDevice = inputs[(index + 1) % inputs.length];
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: nextDevice.deviceId } },
      });
      const newTrack = fresh.getVideoTracks()[0];
      newTrack.enabled = camOnRef.current;

      const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newTrack);

      const previousTrack = current.getVideoTracks()[0];
      if (previousTrack) {
        current.removeTrack(previousTrack);
        previousTrack.stop();
      }
      const nextStream = new MediaStream([...current.getAudioTracks(), newTrack]);
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
    } catch {
      showNotice('Could not switch camera on this device.', 'warn');
    }
  }, [showNotice]);

  /* ---------------------------------------------------------------- calls */

  const startCall = useCallback(
    async (rawId) => {
      const targetId = (rawId || '').trim();
      if (!targetId) {
        showNotice('Enter the call ID you want to reach.', 'warn');
        return;
      }
      if (targetId === myId) {
        showNotice("That's your own ID — share it with the other person instead.", 'warn');
        return;
      }
      if (!socketRef.current?.connected) {
        showNotice('Still connecting to the server. Try again in a moment.', 'warn');
        return;
      }

      setPeer({ name: '', id: targetId });
      remoteIdRef.current = targetId;
      setConnState('new');
      setPhase('outgoing');

      try {
        const stream = await ensureLocalStream();
        const pc = setupPeer();
        addStreamTracks(pc, stream);
        await pc.setLocalDescription(await pc.createOffer());
        socketRef.current.emit('calluser', {
          to: targetId,
          signal: pc.localDescription,
          from: myId,
          name: nameRef.current || 'Someone',
        });
      } catch (error) {
        teardown(mediaErrorMessage(error), 'bad');
      }
    },
    [myId, ensureLocalStream, setupPeer, setPhase, showNotice, teardown],
  );

  const acceptCall = useCallback(async () => {
    const caller = pendingCallerRef.current;
    if (!caller) return;
    setPeer({ name: caller.name || '', id: caller.from });
    setPhase('active');
    try {
      const stream = await ensureLocalStream();
      const pc = setupPeer();
      addStreamTracks(pc, stream);
      await pc.setLocalDescription(await pc.createAnswer());
      socketRef.current.emit('answercall', {
        to: caller.from,
        signal: pc.localDescription,
        name: nameRef.current || 'Someone',
      });
    } catch (error) {
      socketRef.current?.emit('endcall', { to: caller.from });
      teardown(mediaErrorMessage(error), 'bad');
    }
  }, [ensureLocalStream, setPhase, setupPeer, teardown]);

  const declineCall = useCallback(() => {
    const caller = pendingCallerRef.current;
    if (caller) socketRef.current?.emit('rejectcall', { to: caller.from });
    teardown();
  }, [teardown]);

  const hangUp = useCallback(() => {
    const to = remoteIdRef.current;
    if (to) socketRef.current?.emit('endcall', { to });
    teardown('Call ended', 'muted');
  }, [teardown]);

  /* --------------------------------------------------------------- socket */

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 800,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketReady(true);
      setMyId(socket.id);
    });

    socket.on('disconnect', () => setSocketReady(false));

    socket.on('me', (id) => {
      setMyId(id);
      setSocketReady(true);
    });

    socket.on('calluser', async ({ signal, from, name }) => {
      if (statusRef.current !== 'idle') {
        socket.emit('rejectcall', { to: from });
        return;
      }
      pendingCallerRef.current = { from, name };
      remoteIdRef.current = from;
      setPeer({ name: name || '', id: from });
      setConnState('new');
      try {
        const pc = setupPeer();
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await flushIce();
        setPhase('incoming');
      } catch {
        pendingCallerRef.current = null;
        remoteIdRef.current = null;
        socket.emit('rejectcall', { to: from });
        teardown('Could not open that incoming call.', 'bad');
      }
    });

    socket.on('callaccepted', async (payload) => {
      if (!payload?.signal) return;
      if (payload.name) setPeer((prev) => ({ ...prev, name: payload.name }));
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
        await flushIce();
        setPhase('active');
      } catch {
        teardown('The call could not be established.', 'bad');
      }
    });

    socket.on('icecandidate', (candidate) => applyRemoteIce(candidate));

    socket.on('callrejected', () => {
      if (statusRef.current === 'idle') return;
      teardown('Call declined', 'warn');
    });

    socket.on('callended', () => {
      if (statusRef.current === 'idle') return;
      teardown('The other person left the call', 'muted');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      stopStream(localStreamRef.current);
      localStreamRef.current = null;
    };
  }, [applyRemoteIce, flushIce, setPhase, setupPeer, teardown]);

  /* --------------------------------------------------------------- effects */

  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) {
      nameRef.current = saved;
      setMyName(saved);
    }
    setShareSupported(canShare());
  }, []);

  useEffect(() => {
    if (status !== 'active') {
      setElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      clearTimeout(noticeTimerRef.current);
      clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  /* --------------------------------------------------------------- actions */

  const handleNameChange = useCallback((value) => {
    nameRef.current = value;
    setMyName(value);
    try {
      window.localStorage.setItem(NAME_KEY, value);
    } catch {
      /* storage unavailable — non fatal */
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(myId);
    if (ok) {
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      showNotice('Call ID copied to clipboard', 'good');
      return;
    }
    showNotice('Automatic copy is blocked here — long-press the ID to copy it.', 'warn');
  }, [myId, showNotice]);

  const handleShare = useCallback(async () => {
    const shared = await shareText({
      title: 'Noor Video Chat',
      text: `Join my video call.\nMy call ID: ${myId}`,
    });
    if (!shared) await handleCopy();
  }, [handleCopy, myId]);

  /* ----------------------------------------------------------------- view */

  const inCall = status === 'active' || status === 'outgoing';

  let screen = (
    <HomeScreen
      myId={myId}
      socketReady={socketReady}
      myName={myName}
      onNameChange={handleNameChange}
      onStartCall={startCall}
      onCopy={handleCopy}
      onShare={handleShare}
      canShare={shareSupported}
      copied={copied}
      localStream={localStream}
      micOn={micOn}
      camOn={camOn}
      onEnableMedia={enableMedia}
      onReleaseMedia={releaseMedia}
      onToggleMic={toggleMic}
      onToggleCam={toggleCam}
      onSwitchCamera={switchCamera}
    />
  );

  if (inCall) {
    screen = (
      <CallScreen
        status={status}
        peerName={peer.name}
        peerId={peer.id}
        initials={initialsOf(peer.name || peer.id)}
        remoteStream={remoteStream}
        localStream={localStream}
        micOn={micOn}
        camOn={camOn}
        connState={connState}
        elapsed={elapsed}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onSwitchCamera={switchCamera}
        onHangUp={hangUp}
      />
    );
  }

  return (
    <>
      {screen}
      {status === 'incoming' && (
        <IncomingCallOverlay
          callerName={peer.name}
          callerId={peer.id}
          initials={initialsOf(peer.name || peer.id)}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      {notice && (
        <div className={`toast tone-${notice.tone}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      )}
    </>
  );
}
