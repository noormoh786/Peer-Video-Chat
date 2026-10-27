/**
 * Copies text to the clipboard with layered fallbacks.
 *
 * The async Clipboard API only exists in a secure context (https / localhost),
 * so it silently fails on plain http (e.g. a phone hitting a LAN IP). That is
 * the usual reason a "copy ID" button appears to do nothing. We therefore fall
 * back to the legacy execCommand('copy') path, which works over http.
 */
export async function copyText(text) {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }

  return legacyCopy(text);
}

function legacyCopy(text) {
  if (typeof document === 'undefined') return false;

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '0';
  field.style.left = '0';
  field.style.width = '1px';
  field.style.height = '1px';
  field.style.padding = '0';
  field.style.border = 'none';
  field.style.outline = 'none';
  field.style.boxShadow = 'none';
  field.style.background = 'transparent';
  field.style.fontSize = '16px'; // prevents iOS from zooming the page

  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(field);

  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length); // required on iOS
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
}

export function canShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareText({ title, text }) {
  if (!canShare()) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}
