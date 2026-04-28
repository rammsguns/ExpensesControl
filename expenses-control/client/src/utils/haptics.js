/**
 * Haptic feedback utility. Silently fails if Vibration API is unavailable.
 */

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Light tap — selection changed, focus */
export function hapticLight() {
  if (!canVibrate()) return;
  navigator.vibrate(15);
}

/** Medium impact — button press */
export function hapticMedium() {
  if (!canVibrate()) return;
  navigator.vibrate(30);
}

/** Heavy impact — error, delete */
export function hapticHeavy() {
  if (!canVibrate()) return;
  navigator.vibrate(60);
}

/** Success pattern — short double tap */
export function hapticSuccess() {
  if (!canVibrate()) return;
  navigator.vibrate([30, 60, 30]);
}

/** Error pattern — long buzz */
export function hapticError() {
  if (!canVibrate()) return;
  navigator.vibrate(120);
}
