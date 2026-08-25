/**
 * Phase 7 — migrate local project image placeholders into Supabase Storage.
 *
 * Uploads public/media/shoes1.jpeg into each project's gallery folder,
 * then writes SQL to remaps DB paths. Prefer SUPABASE_SERVICE_ROLE_KEY so
 * the script can apply DB updates itself; otherwise use --sql-only output.
 *
 * Usage:
 *   node scripts/migrate-images-to-storage.mjs
 *   node scripts/migrate-images-to-storage.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const LOCAL_IMAGE = join(root, "public/media/shoes1.jpeg");
const BUCKET = "portfolio-media";
const LOCAL_PATH = "/media/shoes1.jpeg";
const OUT_DIR = join(root, "docs");
const REPORT_PATH = join(OUT_DIR, "phase-7-image-migration-report.md");
const SQL_PATH = join(OUT_DIR, "phase-7-path-updates.sql");
const MANIFEST_PATH = join(OUT_DIR, "phase-7-migration-manifest.json");

const dryRun = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    throw new Error("Missing .env.local");
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

function esc(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function uploadObject(supabase, objectPath, bytes, contentType) {
  if (dryRun) {
    return { error: null };
  }
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, bytes, {
      contentType,
      upsert: false,
      cacheControl: "31536000",
    });
  return { error };
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required");
  }
  if (!existsSync(LOCAL_IMAGE)) {
    throw new Error(`Missing local file: ${LOCAL_IMAGE}`);
  }

  const bytes = readFileSync(LOCAL_IMAGE);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const contentType = "image/jpeg";

  // Prefer service role (bypasses RLS for reads/writes). Fall back to anon for
  // storage upload only when a temporary migration policy is active.
  const key = service || anon;
  const usingServiceRole = Boolean(service);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    usingServiceRole
      ? "Using service role client"
      : "Using anon key (storage upload + SQL output for DB updates)",
  );
  if (dryRun) console.log("DRY RUN — no uploads or DB writes");

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, title, cover_image_path, cover_alt_text, cover_width, cover_height")
    .order("slug");

  if (projectsError) {
    throw new Error(`Failed to load projects: ${projectsError.message}`);
  }

  const { data: images, error: imagesError } = await supabase
    .from("project_images")
    .select("id, project_id, storage_path, display_order, alt_text, width, height")
    .order("display_order");

  if (imagesError) {
    throw new Error(`Failed to load project_images: ${imagesError.message}`);
  }

  const imagesByProject = new Map();
  for (const image of images ?? []) {
    const list = imagesByProject.get(image.project_id) ?? [];
    list.push(image);
    imagesByProject.set(image.project_id, list);
  }

  const galleryUpdates = [];
  const coverUpdates = [];
  const failures = [];
  const migratedFiles = [];
  const skipped = [];

  for (const project of projects ?? []) {
    const projectImages = (imagesByProject.get(project.id) ?? []).sort(
      (a, b) => a.display_order - b.display_order,
    );
    const localImages = projectImages.filter(
      (img) => img.storage_path === LOCAL_PATH || img.storage_path.startsWith("/"),
    );
    let firstMigratedPath = null;

    for (const image of localImages) {
      const objectPath = `projects/${project.id}/gallery/${image.id}-shoes1.jpeg`;
      const { error } = await uploadObject(supabase, objectPath, bytes, contentType);
      if (error) {
        failures.push({
          type: "gallery_upload",
          projectId: project.id,
          slug: project.slug,
          imageId: image.id,
          path: objectPath,
          error: error.message,
        });
        console.error(`FAIL gallery ${project.slug} ${image.id}: ${error.message}`);
        continue;
      }

      galleryUpdates.push({
        imageId: image.id,
        projectId: project.id,
        slug: project.slug,
        from: image.storage_path,
        to: objectPath,
        displayOrder: image.display_order,
      });
      migratedFiles.push({
        localFile: "public/media/shoes1.jpeg",
        storagePath: objectPath,
        projectSlug: project.slug,
        kind: "gallery",
        imageId: image.id,
      });
      if (firstMigratedPath == null) firstMigratedPath = objectPath;
      console.log(`OK gallery ${project.slug} #${image.display_order} → ${objectPath}`);
    }

    const coverIsLocal =
      project.cover_image_path === LOCAL_PATH ||
      (project.cover_image_path?.startsWith("/") ?? false);

    if (coverIsLocal) {
      let coverPath = firstMigratedPath;

      if (!coverPath) {
        // Video / cover-only projects: upload a dedicated gallery object for cover.
        const coverId = randomUUID();
        coverPath = `projects/${project.id}/gallery/${coverId}-shoes1.jpeg`;
        const { error } = await uploadObject(supabase, coverPath, bytes, contentType);
        if (error) {
          failures.push({
            type: "cover_upload",
            projectId: project.id,
            slug: project.slug,
            path: coverPath,
            error: error.message,
          });
          console.error(`FAIL cover ${project.slug}: ${error.message}`);
          continue;
        }
        migratedFiles.push({
          localFile: "public/media/shoes1.jpeg",
          storagePath: coverPath,
          projectSlug: project.slug,
          kind: "cover-only",
          imageId: coverId,
        });
        console.log(`OK cover-only ${project.slug} → ${coverPath}`);
      }

      coverUpdates.push({
        projectId: project.id,
        slug: project.slug,
        from: project.cover_image_path,
        to: coverPath,
      });
    } else if (project.cover_image_path) {
      skipped.push({
        slug: project.slug,
        reason: "cover already on storage",
        path: project.cover_image_path,
      });
    }
  }

  const sqlLines = [
    "-- Phase 7 path remaps (generated). Safe to re-run: filters on old local paths.",
    "begin;",
    "",
  ];

  for (const update of galleryUpdates) {
    sqlLines.push(
      `update public.project_images set storage_path = ${esc(update.to)} where id = ${esc(update.imageId)} and storage_path like '/%';`,
    );
  }

  sqlLines.push("");

  for (const update of coverUpdates) {
    sqlLines.push(
      `update public.projects set cover_image_path = ${esc(update.to)} where id = ${esc(update.projectId)} and cover_image_path like '/%';`,
    );
  }

  sqlLines.push("", "commit;", "");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(SQL_PATH, sqlLines.join("\n"));
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        dryRun,
        usingServiceRole,
        sourceFile: "public/media/shoes1.jpeg",
        sourceSha256: sha256,
        sourceBytes: bytes.length,
        galleryUpdates,
        coverUpdates,
        failures,
        skipped,
        migratedFiles,
      },
      null,
      2,
    ),
  );

  let dbApplied = false;
  if (!dryRun && usingServiceRole && failures.length === 0) {
    for (const update of galleryUpdates) {
      const { error } = await supabase
        .from("project_images")
        .update({ storage_path: update.to })
        .eq("id", update.imageId)
        .like("storage_path", "/%");
      if (error) {
        failures.push({
          type: "gallery_db",
          imageId: update.imageId,
          error: error.message,
        });
      }
    }
    for (const update of coverUpdates) {
      const { error } = await supabase
        .from("projects")
        .update({ cover_image_path: update.to })
        .eq("id", update.projectId)
        .like("cover_image_path", "/%");
      if (error) {
        failures.push({
          type: "cover_db",
          projectId: update.projectId,
          error: error.message,
        });
      }
    }
    dbApplied = failures.filter((f) => f.type.endsWith("_db")).length === 0;
  }

  const stillLocal = [
    {
      path: "public/media/shoes1.jpeg",
      references: [
        "Kept on disk until visual verification (Phase 7 requirement)",
        "data/projects.ts seed helpers (reseed source only)",
        "data/about.ts portraitSrc (out of project CMS scope)",
        "Video posters in seed data until video/Mux phases",
      ],
    },
    {
      path: "public/media/videos/CardinTest2.mp4",
      references: [
        "project_videos.source_path still /media/videos/CardinTest2.mp4",
        "Deferred to Mux / video storage phases",
      ],
    },
  ];

  const report = [
    "# Phase 7 — Image migration report",
    "",
    `Generated: ${new Date().toISOString()}`,
    dryRun ? "Mode: **dry-run** (no uploads)" : "Mode: live upload",
    "",
    "## Summary",
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Source file | \`public/media/shoes1.jpeg\` (${bytes.length} bytes) |`,
    `| SHA-256 | \`${sha256}\` |`,
    `| Gallery objects uploaded | ${galleryUpdates.length} |`,
    `| Cover remaps | ${coverUpdates.length} |`,
    `| Failures | ${failures.length} |`,
    `| Covers already on Storage (skipped) | ${skipped.length} |`,
    `| DB updates applied by script | ${dbApplied ? "yes" : "no — use SQL file / MCP"} |`,
    "",
    "## Strategy",
    "",
    "- Every seeded gallery/cover path pointed at the same placeholder JPEG.",
    "- Uploaded one Storage object per gallery row (and cover-only projects) under `projects/{projectId}/gallery/`.",
    "- Preserved `display_order` and existing width/height/alt metadata.",
    "- Did **not** delete local originals.",
    "- Videos left on `/media/videos/...` for later phases.",
    "",
    "## Project mapping (covers)",
    "",
    "| Slug | From | To |",
    "| --- | --- | --- |",
    ...coverUpdates.map(
      (u) => `| ${u.slug} | \`${u.from}\` | \`${u.to}\` |`,
    ),
    "",
    "## Gallery mapping",
    "",
    `| Slug | Order | Image ID | Storage path |`,
    `| --- | ---: | --- | --- |`,
    ...galleryUpdates.map(
      (u) =>
        `| ${u.slug} | ${u.displayOrder} | \`${u.imageId}\` | \`${u.to}\` |`,
    ),
    "",
    "## Failures",
    "",
    failures.length === 0
      ? "_None._"
      : failures.map((f) => `- \`${JSON.stringify(f)}\``).join("\n"),
    "",
    "## Still referenced locally",
    "",
    ...stillLocal.flatMap((item) => [
      `### \`${item.path}\``,
      "",
      ...item.references.map((r) => `- ${r}`),
      "",
    ]),
    "## Follow-ups",
    "",
    "- Visually verify homepage + a few `/work/[slug]` pages.",
    "- Apply `docs/phase-7-path-updates.sql` if the script could not write DB rows.",
    "- Remove temporary Storage anon-upload policy if it was opened for this run.",
    "- Keep `public/media/shoes1.jpeg` until verified; delete later in a cleanup pass.",
    "",
  ].join("\n");

  writeFileSync(REPORT_PATH, report);

  console.log("\n---");
  console.log(`Gallery uploads: ${galleryUpdates.length}`);
  console.log(`Cover remaps: ${coverUpdates.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`SQL: ${SQL_PATH}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
