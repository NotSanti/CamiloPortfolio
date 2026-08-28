import {
  getMediaUrl,
} from "@/src/lib/media";
import { getMuxPosterUrl } from "@/src/lib/mux/playback";
import type {
  ProjectImageRow,
  ProjectRow,
  ProjectVideoRow,
} from "@/types/database";
import type { MediaItem, Project, ProjectSummary } from "@/types/projects";

/** Fields required to map a public video item (home select is intentionally slim). */
type MappableVideo = Pick<
  ProjectVideoRow,
  | "id"
  | "mux_playback_id"
  | "source_path"
  | "status"
  | "title"
  | "display_order"
> & {
  caption?: string | null;
};

type ProjectWithMedia = ProjectRow & {
  project_images?: ProjectImageRow[] | null;
  project_videos?: MappableVideo[] | null;
};

function categoryFromKind(kind: ProjectRow["kind"]): string {
  return kind === "video" ? "Videography" : "Photography";
}

function yearFromTimestamp(value: string): number {
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? year : 0;
}

type CoverSource = Pick<
  ProjectRow,
  | "id"
  | "title"
  | "cover_image_path"
  | "cover_alt_text"
  | "cover_width"
  | "cover_height"
>;

function mapCover(project: CoverSource): MediaItem {
  return {
    id: `cover-${project.id}`,
    type: "image",
    src: getMediaUrl(project.cover_image_path),
    alt: project.cover_alt_text ?? project.title,
    width: project.cover_width ?? 1600,
    height: project.cover_height ?? 2200,
  };
}

function mapImage(image: ProjectImageRow): MediaItem {
  return {
    id: image.id,
    type: "image",
    src: getMediaUrl(image.storage_path),
    alt: image.alt_text ?? "",
    width: image.width ?? 1600,
    height: image.height ?? 2200,
    caption: image.caption?.trim() || undefined,
  };
}

function mapVideo(
  video: MappableVideo,
  cover: MediaItem,
): MediaItem | null {
  // Prefer ready Mux assets for public playback.
  if (video.status === "ready" && video.mux_playback_id) {
    const playbackId = video.mux_playback_id;
    const muxPoster = getMuxPosterUrl(playbackId, { width: 1280 });
    return {
      id: video.id,
      type: "video",
      src: "",
      alt: video.title ?? cover.alt,
      width: cover.width,
      height: cover.height,
      caption: video.caption?.trim() || undefined,
      muxPlaybackId: playbackId,
      posterSrc: cover.src || muxPoster,
    };
  }

  // Legacy Phase 2 static files until Phase 13 migration.
  const src = video.source_path;
  if (!src) {
    return null;
  }

  return {
    id: video.id,
    type: "video",
    src: getMediaUrl(src),
    alt: video.title ?? cover.alt,
    width: cover.width,
    height: cover.height,
    caption: video.caption?.trim() || undefined,
    posterSrc: cover.src || undefined,
  };
}

/** Map a DB project (+ related media) to the UI `Project` shape. */
export function mapProjectRowToProject(row: ProjectWithMedia): Project {
  const cover = mapCover(row);
  const images = [...(row.project_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map(mapImage);

  const videos = [...(row.project_videos ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((video) => mapVideo(video, cover))
    .filter((item): item is MediaItem => item !== null);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: categoryFromKind(row.kind),
    kind: row.kind,
    year: yearFromTimestamp(row.created_at),
    summary: row.description ?? "",
    featured: row.is_featured,
    cover,
    media: [...images, ...videos],
  };
}

function firstReadyPlaybackId(
  videos:
    | Array<
        Pick<ProjectVideoRow, "mux_playback_id" | "status" | "display_order">
      >
    | null
    | undefined,
): string | undefined {
  const ready = [...(videos ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .find((video) => video.status === "ready" && video.mux_playback_id);
  return ready?.mux_playback_id ?? undefined;
}

export function mapProjectRowToSummary(
  row: CoverSource &
    Pick<ProjectRow, "slug" | "kind"> & {
      project_videos?: Array<
        Pick<ProjectVideoRow, "mux_playback_id" | "status" | "display_order">
      > | null;
    },
): ProjectSummary {
  const cover = mapCover(row);
  const muxPlaybackId = firstReadyPlaybackId(row.project_videos);
  if (!cover.src && muxPlaybackId) {
    cover.src = getMuxPosterUrl(muxPlaybackId, { width: 1280 });
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    cover,
    muxPlaybackId,
  };
}
