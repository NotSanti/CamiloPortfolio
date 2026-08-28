export type MediaType = "image" | "video";

export type ProjectKind = "photo" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
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

/** Lean list item for the projects overlay (cover only, no gallery). */
export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  cover: MediaItem;
}
