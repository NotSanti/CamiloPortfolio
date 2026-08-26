/** Row-major 3×3 matrix. */
export type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

/** Unit-sphere sample used as a tile's rest position. */
export type SpherePoint = {
  ux: number;
  uy: number;
  uz: number;
};

export type SphereTileLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  opacity: number;
  zIndex: number;
  front: number;
};

/** Golden angle: successive points land as far as possible from previous ones. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const DEG = Math.PI / 180;

/**
 * Container size at which radius / tile pixel values read literally.
 * Scaling this keeps density between radius and tile size intact.
 */
export const FIT_REFERENCE = 920;

export function identity(): Mat3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

export function rotationX(angle: number): Mat3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

export function rotationY(angle: number): Mat3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

/** Applies the matrix to a point. Writes into `out` to avoid allocating. */
export function transform(
  matrix: Mat3,
  x: number,
  y: number,
  z: number,
  out: Vec3,
): void {
  out.x = matrix[0] * x + matrix[1] * y + matrix[2] * z;
  out.y = matrix[3] * x + matrix[4] * y + matrix[5] * z;
  out.z = matrix[6] * x + matrix[7] * y + matrix[8] * z;
}

/**
 * Gram-Schmidt: multiplied rotation matrices slowly skew from rounding error.
 * Straightening periodically keeps the sphere from visibly distorting.
 */
export function orthonormalize(matrix: Mat3): Mat3 {
  let ax = matrix[0];
  let ay = matrix[1];
  let az = matrix[2];
  let bx = matrix[3];
  let by = matrix[4];
  let bz = matrix[5];

  const la = Math.hypot(ax, ay, az) || 1;
  ax /= la;
  ay /= la;
  az /= la;

  const dot = bx * ax + by * ay + bz * az;
  bx -= ax * dot;
  by -= ay * dot;
  bz -= az * dot;
  const lb = Math.hypot(bx, by, bz) || 1;
  bx /= lb;
  by /= lb;
  bz /= lb;

  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;

  return [ax, ay, az, bx, by, bz, cx, cy, cz];
}

/** Even Fibonacci distribution on the unit sphere. */
export function fibonacciSpherePoints(count: number): SpherePoint[] {
  const n = Math.max(1, Math.floor(count));
  const points: SpherePoint[] = [];

  for (let i = 0; i < n; i += 1) {
    const uy = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - uy * uy));
    const theta = i * GOLDEN_ANGLE;
    points.push({
      ux: Math.cos(theta) * r,
      uy,
      uz: Math.sin(theta) * r,
    });
  }

  return points;
}

export function sphereFitScale(
  containerWidth: number,
  containerHeight: number,
  fitReference: number = FIT_REFERENCE,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 0;
  return Math.min(containerWidth, containerHeight) / fitReference;
}

/**
 * Perspective-project a unit-sphere point to a camera-facing billboard.
 * `distance` must already be clamped to just outside `radius`.
 */
export function projectBillboardTile(
  point: SpherePoint,
  matrix: Mat3,
  params: {
    cx: number;
    cy: number;
    radius: number;
    tileWidth: number;
    tileHeight: number;
    distance: number;
    depthFade: number;
  },
  scratch: Vec3,
  out: SphereTileLayout,
): SphereTileLayout {
  transform(matrix, point.ux, point.uy, point.uz, scratch);
  const z2 = scratch.z;
  const wx = scratch.x * params.radius;
  const wy = scratch.y * params.radius;
  const wz = scratch.z * params.radius;
  const scale = params.distance / (params.distance - wz);
  const width = params.tileWidth * scale;
  const height = params.tileHeight * scale;
  const front = (z2 + 1) / 2;

  out.x = params.cx + wx * scale - width / 2;
  out.y = params.cy + wy * scale - height / 2;
  out.width = width;
  out.height = height;
  out.scale = scale;
  out.opacity = 1 - params.depthFade * (1 - front);
  out.zIndex = Math.round(front * 1e3);
  out.front = front;
  return out;
}
