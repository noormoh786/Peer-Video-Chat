'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches a MediaStream to a <video> element and reports when the browser
 * blocks unmuted playback (common on mobile) so the caller can offer a tap.
 */
export default function VideoTile({
  stream,
  muted = false,
  mirrored = false,
  className = '',
  videoRef,
  onBlockedChange,
}) {
  const innerRef = useRef(null);

  const setRef = (element) => {
    innerRef.current = element;
    if (typeof videoRef === 'function') videoRef(element);
    else if (videoRef) videoRef.current = element;
  };

  useEffect(() => {
    const element = innerRef.current;
    if (!element) return undefined;

    if (element.srcObject !== stream) element.srcObject = stream || null;
    if (!stream) return undefined;

    const attempt = element.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(() => onBlockedChange?.(false))
        .catch(() => onBlockedChange?.(true));
    }
    return undefined;
  }, [stream, onBlockedChange]);

  return (
    <video
      ref={setRef}
      className={`${className}${mirrored ? ' mirror' : ''}`}
      autoPlay
      playsInline
      muted={muted}
    />
  );
}
