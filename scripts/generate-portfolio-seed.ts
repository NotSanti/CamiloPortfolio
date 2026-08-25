import { writeFileSync } from "fs";
import { projects } from "../data/projects";

function esc(value: string | null | undefined): string {
  if (value == null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

const out: string[] = [
  "-- Seed current portfolio metadata (Phase 2).",
  "-- Media paths still reference public/ placeholders until later phases.",
  "-- Idempotent: truncate then insert.",
  "truncate table public.project_images, public.project_videos, public.projects restart identity cascade;",
  "",
];

for (let i = 0; i < projects.length; i += 1) {
  const project = projects[i];
  const images = project.media.filter((item) => item.type === "image");
  const videos = project.media.filter((item) => item.type === "video");

  out.push(`-- ${project.slug}`);
  out.push("do $$");
  out.push("declare");
  out.push("  pid uuid;");
  out.push("begin");
  out.push("  insert into public.projects (");
  out.push("    title, slug, description, kind,");
  out.push("    cover_image_path, cover_alt_text, cover_width, cover_height,");
  out.push("    is_published, is_featured, display_order");
  out.push("  ) values (");
  out.push(`    ${esc(project.title)},`);
  out.push(`    ${esc(project.slug)},`);
  out.push(`    ${esc(project.summary)},`);
  out.push(`    ${esc(project.kind)},`);
  out.push(`    ${esc(project.cover.src)},`);
  out.push(`    ${esc(project.cover.alt)},`);
  out.push(`    ${project.cover.width},`);
  out.push(`    ${project.cover.height},`);
  out.push("    true,");
  out.push("    true,");
  out.push(`    ${i}`);
  out.push("  ) returning id into pid;");
  out.push("");

  for (let j = 0; j < images.length; j += 1) {
    const image = images[j];
    out.push("  insert into public.project_images (");
    out.push(
      "    project_id, storage_path, alt_text, width, height, display_order",
    );
    out.push("  ) values (");
    out.push("    pid,");
    out.push(`    ${esc(image.src)},`);
    out.push(`    ${esc(image.alt)},`);
    out.push(`    ${image.width},`);
    out.push(`    ${image.height},`);
    out.push(`    ${j}`);
    out.push("  );");
  }

  for (let j = 0; j < videos.length; j += 1) {
    const video = videos[j];
    out.push("  insert into public.project_videos (");
    out.push("    project_id, source_path, status, title, display_order");
    out.push("  ) values (");
    out.push("    pid,");
    out.push(`    ${esc(video.src)},`);
    out.push("    'ready',");
    out.push(`    ${esc(video.alt)},`);
    out.push(`    ${j}`);
    out.push("  );");
  }

  out.push("end $$;");
  out.push("");
}

writeFileSync(
  "supabase/migrations/20260825041318_seed_portfolio_projects.sql",
  `${out.join("\n")}\n`,
);

console.log(`Wrote seed for ${projects.length} projects`);
