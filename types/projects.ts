export type MediaType = "image" | "video";

export type ProjectKind = "photo" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  alt: string;
  width: number;
  height: number;
  posterSrc?: string;
  /** When set, public players use Mux adaptive streaming instead of `src`. */
  muxPlaybackId?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  kind: ProjectKind;
  year: number;
  summary: string;
  featured: boolean;
  cover: MediaItem;
  media: MediaItem[];
}

/** Thin list item for the projects overlay (no media payload). */
export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
}
