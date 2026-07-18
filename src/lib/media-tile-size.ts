/** Display size for stream tiles: short side ≈ 160px (Figma portrait width). */
export function getMediaTileDisplaySize(
  width: number,
  height: number,
  base = 160,
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

/** Carousel tiles: fixed row height, width follows media aspect ratio. */
export function getCarouselDisplaySize(
  width: number,
  height: number,
  rowHeight = 459,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.round(rowHeight * (8 / 11)), height: rowHeight };
  }

  return {
    width: Math.round(rowHeight * (width / height)),
    height: rowHeight,
  };
}

/** Filmstrip thumbs under expanded photo view. */
export function getFilmstripDisplaySize(
  width: number,
  height: number,
  rowHeight = 105,
): { width: number; height: number } {
  return getCarouselDisplaySize(width, height, rowHeight);
}
