/** Display size for stream tiles: short side defaults to 384px. */
export function getMediaTileDisplaySize(
  width: number,
  height: number,
  base = 384,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: base, height: Math.round((base * 11) / 8) };
  }

  const ratio = width / height;

  if (ratio >= 1) {
    return {
      width: Math.round(base * ratio),
      height: base,
    };
  }

  return {
    width: base,
    height: Math.round(base / ratio),
  };
}

