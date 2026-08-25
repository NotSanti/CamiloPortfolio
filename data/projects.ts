import type { MediaItem, Project, ProjectKind } from "@/types/projects";

/**
 * Local mock portfolio used as the Phase 2 seed source of truth.
 * The public site reads from Supabase via `src/services/projects`.
 * Keep this file until media migration is verified, then remove.
 */

type CoverSize = {
  width: number;
  height: number;
};

const SIZES = {
  portrait811: { width: 1600, height: 2200 },
  portrait916: { width: 1080, height: 1920 },
  portrait45: { width: 1600, height: 2000 },
  landscape32: { width: 1800, height: 1200 },
  landscape169: { width: 1920, height: 1080 },
  landscape43: { width: 2000, height: 1500 },
  square: { width: 1400, height: 1400 },
  ultrawide: { width: 2400, height: 1000 },
} as const;

function image(
  id: string,
  alt: string,
  size: CoverSize,
): MediaItem {
  return {
    id,
    type: "image",
    src: "/media/shoes1.jpeg",
    alt,
    width: size.width,
    height: size.height,
  };
}

function video(
  id: string,
  alt: string,
  size: CoverSize,
): MediaItem {
  return {
    id,
    type: "video",
    src: "/media/videos/CardinTest2.mp4",
    posterSrc: "/media/shoes1.jpeg",
    alt,
    width: size.width,
    height: size.height,
  };
}

function project(input: {
  id: string;
  slug: string;
  title: string;
  category: string;
  kind: ProjectKind;
  year: number;
  summary: string;
  cover: MediaItem;
  media: MediaItem[];
}): Project {
  return {
    ...input,
    featured: true,
  };
}

export const projects: Project[] = [
  project({
    id: "project-1",
    slug: "montreal-editorial",
    title: "Montreal Editorial",
    category: "Photography",
    kind: "photo",
    year: 2026,
    summary: "An editorial study of movement, texture and urban space.",
    cover: image("cover-1", "Editorial portrait photographed in Montreal", SIZES.portrait811),
    media: [
      image("m1-1", "Editorial frame one", SIZES.portrait811),
      image("m1-2", "Editorial frame two", SIZES.landscape32),
      image("m1-3", "Editorial frame three", SIZES.square),
      image("m1-4", "Editorial frame four", SIZES.portrait916),
      image("m1-5", "Editorial frame five", SIZES.ultrawide),
      image("m1-6", "Editorial frame six", SIZES.landscape43),
    ],
  }),
  project({
    id: "project-2",
    slug: "night-motion",
    title: "Night Motion",
    category: "Videography",
    kind: "video",
    year: 2025,
    summary: "Long-exposure city motion study after dark.",
    cover: image("cover-2", "Night street scene with motion blur", SIZES.landscape169),
    media: [
      video("v2-1", "Night motion film", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-3",
    slug: "studio-texture",
    title: "Studio Texture",
    category: "Photography",
    kind: "photo",
    year: 2025,
    summary: "Close studies of fabric, light and material.",
    cover: image("cover-3", "Studio still life with textured fabric", SIZES.square),
    media: [
      image("m3-1", "Studio texture one", SIZES.square),
      image("m3-2", "Studio texture two", SIZES.portrait45),
      image("m3-3", "Studio texture three", SIZES.landscape32),
      image("m3-4", "Studio texture four", SIZES.portrait811),
      image("m3-5", "Studio texture five", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-4",
    slug: "coastal-light",
    title: "Coastal Light",
    category: "Photography",
    kind: "photo",
    year: 2025,
    summary: "Soft coastal light across water and sand.",
    cover: image("cover-4", "Coastal landscape under soft daylight", SIZES.landscape32),
    media: [
      image("m4-1", "Coastal light one", SIZES.landscape32),
      image("m4-2", "Coastal light two", SIZES.ultrawide),
      image("m4-3", "Coastal light three", SIZES.portrait916),
      image("m4-4", "Coastal light four", SIZES.square),
      image("m4-5", "Coastal light five", SIZES.landscape43),
      image("m4-6", "Coastal light six", SIZES.portrait45),
    ],
  }),
  project({
    id: "project-5",
    slug: "frame-rate",
    title: "Frame Rate",
    category: "Videography",
    kind: "video",
    year: 2024,
    summary: "Rhythm and pacing in short-form motion.",
    cover: image("cover-5", "Still frame from a short motion piece", SIZES.portrait916),
    media: [
      video("v5-1", "Frame rate film", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-6",
    slug: "urban-grain",
    title: "Urban Grain",
    category: "Photography",
    kind: "photo",
    year: 2024,
    summary: "Grain and contrast in downtown architecture.",
    cover: image("cover-6", "Urban architecture with strong contrast", SIZES.portrait45),
    media: [
      image("m6-1", "Urban grain one", SIZES.portrait45),
      image("m6-2", "Urban grain two", SIZES.landscape169),
      image("m6-3", "Urban grain three", SIZES.portrait811),
      image("m6-4", "Urban grain four", SIZES.square),
      image("m6-5", "Urban grain five", SIZES.ultrawide),
    ],
  }),
  project({
    id: "project-7",
    slug: "quiet-rooms",
    title: "Quiet Rooms",
    category: "Photography",
    kind: "photo",
    year: 2024,
    summary: "Interior stillness and ambient light.",
    cover: image("cover-7", "Quiet interior room with ambient light", SIZES.landscape43),
    media: [
      image("m7-1", "Quiet rooms one", SIZES.landscape43),
      image("m7-2", "Quiet rooms two", SIZES.portrait916),
      image("m7-3", "Quiet rooms three", SIZES.square),
      image("m7-4", "Quiet rooms four", SIZES.landscape32),
    ],
  }),
  project({
    id: "project-8",
    slug: "field-notes",
    title: "Field Notes",
    category: "Photography",
    kind: "photo",
    year: 2024,
    summary: "Documentary fragments from travel days.",
    cover: image("cover-8", "Documentary travel photograph", SIZES.ultrawide),
    media: [
      image("m8-1", "Field notes one", SIZES.ultrawide),
      image("m8-2", "Field notes two", SIZES.portrait811),
      image("m8-3", "Field notes three", SIZES.landscape32),
      image("m8-4", "Field notes four", SIZES.square),
      image("m8-5", "Field notes five", SIZES.portrait45),
      image("m8-6", "Field notes six", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-9",
    slug: "red-hour",
    title: "Red Hour",
    category: "Photography",
    kind: "photo",
    year: 2023,
    summary: "Warm light and saturated evening tones.",
    cover: image("cover-9", "Scene lit by warm evening light", SIZES.portrait811),
    media: [
      image("m9-1", "Red hour one", SIZES.portrait811),
      image("m9-2", "Red hour two", SIZES.landscape43),
      image("m9-3", "Red hour three", SIZES.square),
      image("m9-4", "Red hour four", SIZES.portrait916),
    ],
  }),
  project({
    id: "project-10",
    slug: "glass-lines",
    title: "Glass Lines",
    category: "Photography",
    kind: "photo",
    year: 2023,
    summary: "Reflections and linear structure in glass.",
    cover: image("cover-10", "Glass facade with linear reflections", SIZES.landscape169),
    media: [
      image("m10-1", "Glass lines one", SIZES.landscape169),
      image("m10-2", "Glass lines two", SIZES.portrait45),
      image("m10-3", "Glass lines three", SIZES.ultrawide),
      image("m10-4", "Glass lines four", SIZES.square),
      image("m10-5", "Glass lines five", SIZES.landscape32),
    ],
  }),
  project({
    id: "project-11",
    slug: "soft-focus",
    title: "Soft Focus",
    category: "Photography",
    kind: "photo",
    year: 2023,
    summary: "Shallow depth and delicate detail.",
    cover: image("cover-11", "Soft-focus detail photograph", SIZES.square),
    media: [
      image("m11-1", "Soft focus one", SIZES.square),
      image("m11-2", "Soft focus two", SIZES.portrait811),
      image("m11-3", "Soft focus three", SIZES.landscape32),
      image("m11-4", "Soft focus four", SIZES.portrait916),
    ],
  }),
  project({
    id: "project-12",
    slug: "cutaway",
    title: "Cutaway",
    category: "Videography",
    kind: "video",
    year: 2023,
    summary: "Editorial cutaways for narrative pace.",
    cover: image("cover-12", "Editorial cutaway still from video", SIZES.portrait916),
    media: [
      video("v12-1", "Cutaway film", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-13",
    slug: "open-road",
    title: "Open Road",
    category: "Photography",
    kind: "photo",
    year: 2022,
    summary: "Wide frames along empty highways.",
    cover: image("cover-13", "Open road landscape photograph", SIZES.landscape32),
    media: [
      image("m13-1", "Open road one", SIZES.landscape32),
      image("m13-2", "Open road two", SIZES.ultrawide),
      image("m13-3", "Open road three", SIZES.portrait45),
      image("m13-4", "Open road four", SIZES.square),
      image("m13-5", "Open road five", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-14",
    slug: "after-image",
    title: "After Image",
    category: "Photography",
    kind: "photo",
    year: 2022,
    summary: "Residual light and afterimage studies.",
    cover: image("cover-14", "Abstract light study photograph", SIZES.landscape43),
    media: [
      image("m14-1", "After image one", SIZES.landscape43),
      image("m14-2", "After image two", SIZES.portrait811),
      image("m14-3", "After image three", SIZES.square),
      image("m14-4", "After image four", SIZES.ultrawide),
      image("m14-5", "After image five", SIZES.portrait916),
      image("m14-6", "After image six", SIZES.landscape32),
    ],
  }),
  project({
    id: "project-15",
    slug: "steel-horizon",
    title: "Steel Horizon",
    category: "Photography",
    kind: "photo",
    year: 2022,
    summary: "Industrial skylines at blue hour.",
    cover: image("cover-15", "Industrial skyline at blue hour", SIZES.landscape169),
    media: [
      image("m15-1", "Steel horizon one", SIZES.landscape169),
      image("m15-2", "Steel horizon two", SIZES.portrait45),
      image("m15-3", "Steel horizon three", SIZES.square),
      image("m15-4", "Steel horizon four", SIZES.ultrawide),
    ],
  }),
  project({
    id: "project-16",
    slug: "pulse-line",
    title: "Pulse Line",
    category: "Videography",
    kind: "video",
    year: 2022,
    summary: "Transit corridors as rhythmic motion studies.",
    cover: image("cover-16", "Transit corridor motion study", SIZES.landscape32),
    media: [video("v16-1", "Pulse line film", SIZES.landscape169)],
  }),
  project({
    id: "project-17",
    slug: "paper-weight",
    title: "Paper Weight",
    category: "Photography",
    kind: "photo",
    year: 2021,
    summary: "Still lifes of paper, ink and shadow.",
    cover: image("cover-17", "Paper still life with shadow", SIZES.square),
    media: [
      image("m17-1", "Paper weight one", SIZES.square),
      image("m17-2", "Paper weight two", SIZES.portrait811),
      image("m17-3", "Paper weight three", SIZES.landscape43),
    ],
  }),
  project({
    id: "project-18",
    slug: "cold-front",
    title: "Cold Front",
    category: "Photography",
    kind: "photo",
    year: 2021,
    summary: "Winter weather across open fields.",
    cover: image("cover-18", "Winter field under grey sky", SIZES.ultrawide),
    media: [
      image("m18-1", "Cold front one", SIZES.ultrawide),
      image("m18-2", "Cold front two", SIZES.landscape32),
      image("m18-3", "Cold front three", SIZES.portrait916),
      image("m18-4", "Cold front four", SIZES.square),
    ],
  }),
  project({
    id: "project-19",
    slug: "signal-loss",
    title: "Signal Loss",
    category: "Videography",
    kind: "video",
    year: 2021,
    summary: "Interference and dropout as visual language.",
    cover: image("cover-19", "Abstract signal interference still", SIZES.landscape169),
    media: [video("v19-1", "Signal loss film", SIZES.landscape169)],
  }),
  project({
    id: "project-20",
    slug: "drywall",
    title: "Drywall",
    category: "Photography",
    kind: "photo",
    year: 2021,
    summary: "Construction interiors before finish work.",
    cover: image("cover-20", "Unfinished interior with drywall", SIZES.portrait45),
    media: [
      image("m20-1", "Drywall one", SIZES.portrait45),
      image("m20-2", "Drywall two", SIZES.landscape43),
      image("m20-3", "Drywall three", SIZES.square),
      image("m20-4", "Drywall four", SIZES.portrait811),
    ],
  }),
  project({
    id: "project-21",
    slug: "late-shift",
    title: "Late Shift",
    category: "Photography",
    kind: "photo",
    year: 2020,
    summary: "Night workers and empty storefronts.",
    cover: image("cover-21", "Night storefront photograph", SIZES.landscape32),
    media: [
      image("m21-1", "Late shift one", SIZES.landscape32),
      image("m21-2", "Late shift two", SIZES.portrait916),
      image("m21-3", "Late shift three", SIZES.ultrawide),
    ],
  }),
  project({
    id: "project-22",
    slug: "amber-hold",
    title: "Amber Hold",
    category: "Photography",
    kind: "photo",
    year: 2020,
    summary: "Warm practical light in small rooms.",
    cover: image("cover-22", "Room lit by amber practical light", SIZES.portrait811),
    media: [
      image("m22-1", "Amber hold one", SIZES.portrait811),
      image("m22-2", "Amber hold two", SIZES.square),
      image("m22-3", "Amber hold three", SIZES.landscape43),
      image("m22-4", "Amber hold four", SIZES.portrait45),
    ],
  }),
  project({
    id: "project-23",
    slug: "runway-dust",
    title: "Runway Dust",
    category: "Videography",
    kind: "video",
    year: 2020,
    summary: "Airport peripheries and heat haze.",
    cover: image("cover-23", "Airport periphery heat haze", SIZES.landscape169),
    media: [video("v23-1", "Runway dust film", SIZES.landscape169)],
  }),
  project({
    id: "project-24",
    slug: "mirror-pool",
    title: "Mirror Pool",
    category: "Photography",
    kind: "photo",
    year: 2019,
    summary: "Reflections in shallow urban water.",
    cover: image("cover-24", "Urban water reflection", SIZES.square),
    media: [
      image("m24-1", "Mirror pool one", SIZES.square),
      image("m24-2", "Mirror pool two", SIZES.landscape32),
      image("m24-3", "Mirror pool three", SIZES.portrait916),
      image("m24-4", "Mirror pool four", SIZES.ultrawide),
    ],
  }),
  project({
    id: "project-25",
    slug: "northbound",
    title: "Northbound",
    category: "Photography",
    kind: "photo",
    year: 2019,
    summary: "Highway sequences toward colder latitudes.",
    cover: image("cover-25", "Highway stretching north", SIZES.landscape43),
    media: [
      image("m25-1", "Northbound one", SIZES.landscape43),
      image("m25-2", "Northbound two", SIZES.portrait45),
      image("m25-3", "Northbound three", SIZES.landscape169),
    ],
  }),
  project({
    id: "project-26",
    slug: "static-bloom",
    title: "Static Bloom",
    category: "Videography",
    kind: "video",
    year: 2019,
    summary: "Floral forms dissolving into grain.",
    cover: image("cover-26", "Floral form dissolving into grain", SIZES.portrait811),
    media: [video("v26-1", "Static bloom film", SIZES.landscape169)],
  }),
  project({
    id: "project-27",
    slug: "flatline",
    title: "Flatline",
    category: "Photography",
    kind: "photo",
    year: 2018,
    summary: "Horizon studies with minimal contrast.",
    cover: image("cover-27", "Minimal horizon study", SIZES.ultrawide),
    media: [
      image("m27-1", "Flatline one", SIZES.ultrawide),
      image("m27-2", "Flatline two", SIZES.landscape32),
      image("m27-3", "Flatline three", SIZES.square),
    ],
  }),
  project({
    id: "project-28",
    slug: "cargo-bay",
    title: "Cargo Bay",
    category: "Photography",
    kind: "photo",
    year: 2018,
    summary: "Loading docks and packed volumes.",
    cover: image("cover-28", "Loading dock cargo volumes", SIZES.landscape169),
    media: [
      image("m28-1", "Cargo bay one", SIZES.landscape169),
      image("m28-2", "Cargo bay two", SIZES.portrait45),
      image("m28-3", "Cargo bay three", SIZES.square),
      image("m28-4", "Cargo bay four", SIZES.landscape43),
    ],
  }),
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((item) => item.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((item) => item.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((item) => item.slug);
}
