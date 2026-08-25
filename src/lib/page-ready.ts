const SETTLE_MS = 120;
const SETTLE_PASSES = 5;
const IMAGE_TIMEOUT_MS = 8000;
const VIDEO_TIMEOUT_MS = 8000;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isTrackableImage(img: HTMLImageElement): boolean {
  if (!img.src || img.src.startsWith("data:")) {
    return false;
  }
  if (img.naturalWidth === 1 && img.naturalHeight === 1 && img.complete) {
    return false;
  }
  return true;
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    window.setTimeout(done, IMAGE_TIMEOUT_MS);
  });
}

type MediaHost = HTMLElement & {
  media?: HTMLMediaElement | null;
};

function getMountedMediaHosts(): MediaHost[] {
  const muxPlayers = [
    ...document.querySelectorAll<MediaHost>("mux-player"),
  ];
  const videos = [...document.querySelectorAll<HTMLVideoElement>("video")];
  return [...muxPlayers, ...videos];
}

function getUnderlyingMedia(host: MediaHost): HTMLMediaElement | null {
  if (host instanceof HTMLVideoElement) {
    return host;
  }
  if (host.media) {
    return host.media;
  }
  return host.shadowRoot?.querySelector("video") ?? null;
}

function isMediaReady(media: HTMLMediaElement | null): boolean {
  if (!media) {
    return false;
  }
  return media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

function waitForMediaHost(host: MediaHost): Promise<void> {
  const media = getUnderlyingMedia(host);
  if (isMediaReady(media)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    const targets: EventTarget[] = [host];
    if (media) {
      targets.push(media);
    }

    for (const target of targets) {
      target.addEventListener("loadeddata", done, { once: true });
      target.addEventListener("canplay", done, { once: true });
      target.addEventListener("error", done, { once: true });
    }

    window.setTimeout(done, VIDEO_TIMEOUT_MS);
  });
}

export type PageReadyResult = {
  imageCount: number;
  imagesLoaded: number;
  videoCount: number;
  videosReady: number;
  elapsedMs: number;
  readyState: DocumentReadyState;
};

/**
 * Resolves when fonts, trackable images, and mounted Mux/native videos have
 * settled (or timed out), and the document has reached the load event.
 */
export async function waitForPageReady(
  signal?: { cancelled: boolean },
): Promise<PageReadyResult> {
  const started = performance.now();

  try {
    await document.fonts.ready;
  } catch {
    // Fonts API unavailable.
  }

  for (let pass = 0; pass < SETTLE_PASSES; pass += 1) {
    if (signal?.cancelled) {
      break;
    }
    const images = [...document.images].filter(isTrackableImage);
    const mediaHosts = getMountedMediaHosts();
    await Promise.all([
      ...images.map(waitForImage),
      ...mediaHosts.map(waitForMediaHost),
    ]);
    await delay(SETTLE_MS);
  }

  if (document.readyState !== "complete") {
    await Promise.race([
      new Promise<void>((resolve) => {
        window.addEventListener("load", () => resolve(), { once: true });
      }),
      delay(IMAGE_TIMEOUT_MS),
    ]);
  }

  const images = [...document.images].filter(isTrackableImage);
  const mediaHosts = getMountedMediaHosts();
  const videosReady = mediaHosts.filter((host) =>
    isMediaReady(getUnderlyingMedia(host)),
  ).length;

  return {
    imageCount: images.length,
    imagesLoaded: images.filter((img) => img.complete).length,
    videoCount: mediaHosts.length,
    videosReady,
    elapsedMs: Math.round(performance.now() - started),
    readyState: document.readyState,
  };
}
