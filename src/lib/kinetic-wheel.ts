/** Arc step from the Kinetic Wheel reference (~25 visible slots ±75°). */
export const ANGLE_STEP_DEG = 6.25;

/** Extra X indent on the focused title, in pixels. */
export const FOCUS_INDENT_PX = 30;

/** Hide / fade titles past this angle from center. */
export const MAX_ANGLE_DEG = 80;

/** Visible titles around the center (12 each side + current). */
export const VISIBLE_SLOTS = 25;

export const FRICTION = 0.94;

export const TAP_SLOP_PX = 6;

/**
 * Pixel-mode mouse notches (Windows/Chrome) are typically 100–120px.
 * Trackpad events are much smaller; keep those proportional.
 */
export const MOUSE_NOTCH_PX = 50;

const DEG = Math.PI / 180;
const REDUCED_LINE_PX = 44;
const MIN_RADIUS_PX = 160;
const MAX_RADIUS_PX = 330;

export type WheelSlotLayout = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  visible: boolean;
  focused: boolean;
};

export function copyCount(projectCount: number): number {
  if (projectCount <= 0) {
    return 0;
  }

  return Math.max(3, Math.ceil(VISIBLE_SLOTS / projectCount));
}

export function startOffset(projectCount: number, copies: number): number {
  if (projectCount <= 0 || copies < 3) {
    return 0;
  }

  return projectCount * Math.floor(copies / 2);
}

/** Keep the offset inside a middle copy so wrapping is visually seamless. */
export function wrapOffset(
  offset: number,
  projectCount: number,
  copies: number,
): number {
  if (projectCount <= 0 || copies < 3 || !Number.isFinite(offset)) {
    return 0;
  }

  const span = projectCount;
  const high = span * (copies - 1);
  let next = offset;

  while (next < span) {
    next += span;
  }

  while (next >= high) {
    next -= span;
  }

  return next;
}

export function wrapIndex(value: number, count: number): number {
  if (count <= 0 || !Number.isFinite(value)) {
    return 0;
  }

  return ((Math.round(value) % count) + count) % count;
}

export function wheelRadius(
  columnHeight: number,
  columnWidth = Number.POSITIVE_INFINITY,
): number {
  if (!Number.isFinite(columnHeight) || columnHeight <= 0) {
    return MAX_RADIUS_PX;
  }

  if (Number.isFinite(columnWidth) && columnWidth > 0 && columnWidth < 768) {
    return Math.max(64, Math.min(120, columnWidth * 0.32));
  }

  return Math.max(
    MIN_RADIUS_PX,
    Math.min(MAX_RADIUS_PX, columnHeight * 0.42),
  );
}

export function pixelsPerItem(
  radius: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) {
    return REDUCED_LINE_PX;
  }

  return Math.max(28, radius * Math.sin(ANGLE_STEP_DEG * DEG));
}

/** Convert a wheel event into item units (one mouse notch = one item). */
export function wheelDeltaItems(
  deltaY: number,
  deltaMode: number,
  itemPixels: number,
): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return 0;
  }

  if (deltaMode === 1 || deltaMode === 2) {
    return Math.sign(deltaY);
  }

  if (Math.abs(deltaY) >= MOUSE_NOTCH_PX) {
    return Math.sign(deltaY);
  }

  if (itemPixels <= 0) {
    return 0;
  }

  return deltaY / itemPixels;
}

export function slotLayout(
  slot: number,
  offset: number,
  radius: number,
  reducedMotion: boolean,
): WheelSlotLayout {
  const delta = slot - offset;
  const focusT = Math.max(0, 1 - Math.abs(delta));
  const indent = FOCUS_INDENT_PX * focusT;
  const focused = Math.abs(delta) < 0.5;

  if (reducedMotion) {
    const y = delta * REDUCED_LINE_PX;
    const opacity = Math.abs(delta) > 8 ? 0 : 1;

    return {
      x: indent,
      y,
      rotate: 0,
      scale: 1,
      opacity,
      visible: opacity > 0.05,
      focused,
    };
  }

  const angleDeg = delta * ANGLE_STEP_DEG;
  const angle = angleDeg * DEG;
  const absAngle = Math.abs(angleDeg);
  let opacity = 1;

  if (absAngle > 70) {
    opacity = Math.max(0, 1 - (absAngle - 70) / (MAX_ANGLE_DEG - 70));
  }

  return {
    x: radius * (Math.cos(angle) - 1) + indent,
    y: radius * Math.sin(angle),
    rotate: angleDeg,
    scale: Math.max(0.9, 1 - 0.001 * absAngle),
    opacity,
    visible: opacity > 0.05,
    focused,
  };
}
