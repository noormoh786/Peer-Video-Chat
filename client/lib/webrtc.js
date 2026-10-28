const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME;
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

/**
 * STUN only discovers the public address; it cannot relay media through a
 * symmetric NAT (typical on carrier and corporate networks). When a TURN URL
 * is provided, it is appended as a relay so those calls still connect.
 * Multiple comma-separated URLs are supported.
 */
function turnServers() {
  if (!TURN_URL) return [];
  const urls = TURN_URL.split(',').map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) return [];
  const server = { urls };
  if (TURN_USERNAME) server.username = TURN_USERNAME;
  if (TURN_CREDENTIAL) server.credential = TURN_CREDENTIAL;
  return [server];
}

export const ICE_SERVERS = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ],
  },
  ...turnServers(),
];

export function createPeerConnection(handlers = {}) {
  const pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 8,
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) handlers.onIceCandidate?.(event.candidate);
  };

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) handlers.onTrack?.(stream);
  };

  pc.onconnectionstatechange = () => handlers.onConnectionStateChange?.(pc.connectionState);

  return pc;
}

export function getMedia() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  });
}

export function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function addStreamTracks(pc, stream) {
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
}

export function connectionLabel(state) {
  switch (state) {
    case 'connected':
      return { text: 'Connected', tone: 'good' };
    case 'connecting':
    case 'new':
      return { text: 'Connecting…', tone: 'warn' };
    case 'disconnected':
      return { text: 'Reconnecting…', tone: 'warn' };
    case 'failed':
      return { text: 'Connection lost', tone: 'bad' };
    default:
      return { text: 'Idle', tone: 'muted' };
  }
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}
