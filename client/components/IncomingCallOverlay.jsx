'use client';

import { PhoneIcon, PhoneOffIcon } from './Icons';

export default function IncomingCallOverlay({ callerName, callerId, initials, onAccept, onDecline }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Incoming call">
      <div className="incoming">
        <div className="avatar lg pulse">{initials}</div>
        <p className="eyebrow">Incoming video call</p>
        <h2>{callerName?.trim() || 'Unknown caller'}</h2>
        <p className="mono">{callerId}</p>

        <div className="incoming-actions">
          <button type="button" className="round decline" onClick={onDecline} aria-label="Decline call">
            <PhoneOffIcon />
            <span>Decline</span>
          </button>
          <button type="button" className="round accept" onClick={onAccept} aria-label="Accept call">
            <PhoneIcon />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
