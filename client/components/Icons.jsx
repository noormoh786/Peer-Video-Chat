const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function MicIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
    </svg>
  );
}

export function MicOffIcon() {
  return (
    <svg {...base}>
      <path d="M15 9.5V5.5a3 3 0 0 0-5.9-.8" />
      <path d="M9 9v2a3 3 0 0 0 4.6 2.55" />
      <path d="M5.5 11a6.5 6.5 0 0 0 9.9 5.6" />
      <path d="M18.5 11v.4" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function VideoIcon() {
  return (
    <svg {...base}>
      <rect x="2.5" y="6" width="13" height="12" rx="3.5" />
      <path d="M15.5 10.5l4-2.4a1 1 0 0 1 1.5.9v6a1 1 0 0 1-1.5.9l-4-2.4" />
    </svg>
  );
}

export function VideoOffIcon() {
  return (
    <svg {...base}>
      <path d="M15.5 10.5l4-2.4a1 1 0 0 1 1.5.9v6a1 1 0 0 1-1.5.9l-2.2-1.3" />
      <path d="M12.5 18h-6.5a3.5 3.5 0 0 1-3.5-3.5v-5A3.5 3.5 0 0 1 6 6h6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function PhoneOffIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <path d="M2.6 9.6a16 16 0 0 1 18.8 0" />
      <path d="M6.4 13.2l1.9 2.2a1 1 0 0 0 1.2.2l2.5-1.5 2.5 1.5a1 1 0 0 0 1.2-.2l1.9-2.2" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg {...base} strokeWidth={1.9}>
      <path d="M6.6 3.5h2.2l1.3 3.4-1.8 1.2a11.5 11.5 0 0 0 5.6 5.6l1.2-1.8 3.4 1.3v2.2a2 2 0 0 1-2.2 2 16.5 16.5 0 0 1-13.7-13.7 2 2 0 0 1 2-2.2z" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...base} strokeWidth={1.7}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="3" />
      <path d="M15 6.2A2.7 2.7 0 0 0 12.3 3.5H6.7A3.2 3.2 0 0 0 3.5 6.7v5.6A2.7 2.7 0 0 0 6.2 15" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...base} strokeWidth={2.2}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg {...base} strokeWidth={1.7}>
      <path d="M12 15V3.5" />
      <path d="M7.8 7.5L12 3.3l4.2 4.2" />
      <path d="M5.5 13.5v5.2a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8v-5.2" />
    </svg>
  );
}

export function SwitchCameraIcon() {
  return (
    <svg {...base} strokeWidth={1.7}>
      <path d="M3.5 9.5A8.5 8.5 0 0 1 19 7.2" />
      <path d="M20.5 4.5v4h-4" />
      <path d="M20.5 14.5A8.5 8.5 0 0 1 5 16.8" />
      <path d="M3.5 19.5v-4h4" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg {...base} strokeWidth={1.8}>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg {...base} strokeWidth={1.7}>
      <path d="M12 3l7 2.7v5.5c0 4.3-2.9 8.2-7 9.3-4.1-1.1-7-5-7-9.3V5.7z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}
