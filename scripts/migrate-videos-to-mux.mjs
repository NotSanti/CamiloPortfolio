/**
 * Phase 13 — migrate local project videos into Mux.
 *
 * Inventory: all seeded project_videos currently point at
 * public/media/videos/CardinTest2.mp4. This script uploads that file once,
 * waits until the asset is ready, then remaps every legacy row to the same
 * Mux asset/playback IDs (identical placeholder source).
 *
 * Does not delete local files.
 *
 * Usage:
 *   node scripts/migrate-videos-to-mux.mjs
 *   node scripts/migrate-videos-to-mux.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const LOCAL_VIDEO = join(root, "public/media/videos/CardinTest2.mp4");
const LOCAL_PATH = "/media/videos/CardinTest2.mp4";
const OUT_DIR = join(root, "docs");
const REPORT_PATH = join(OUT_DIR, "phase-13-video-migration-report.md");
const MANIFEST_PATH = join(OUT_DIR, "phase-13-migration-manifest.json");

const dryRun = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) throw new Error("Missing .env.local");
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function firstPublicPlaybackId(playbackIds) {
  if (!playbackIds?.length) return null;
  const pub = playbackIds.find((item) => item.policy === "public");
  return pub?.id ?? playbackIds[0]?.id ?? null;
}

async function putFile(uploadUrl, bytes, contentType) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mux PUT failed (${response.status}): ${text}`);
  }
}

async function waitForUploadAsset(mux, uploadId, { timeoutMs = 10 * 60 * 1000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const upload = await mux.video.uploads.retrieve(uploadId);
    if (upload.status === "asset_created" && upload.asset_id) {
      return upload.asset_id;
    }
    if (upload.status === "errored" || upload.status === "cancelled" || upload.status === "timed_out") {
      throw new Error(`Mux upload ${uploadId} ended as ${upload.status}`);
    }
    process.stdout.write(".");
    await sleep(3000);
  }
  throw new Error(`Timed out waiting for upload ${uploadId} to create an asset`);
}

async function waitForAssetReady(mux, assetId, { timeoutMs = 15 * 60 * 1000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const asset = await mux.video.assets.retrieve(assetId);
    if (asset.status === "ready") {
      return asset;
    }
    if (asset.status === "errored") {
      throw new Error(`Mux asset ${assetId} errored`);
    }
    process.stdout.write(".");
    await sleep(4000);
  }
  throw new Error(`Timed out waiting for asset ${assetId} to become ready`);
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const muxTokenId = env.MUX_TOKEN_ID;
  const muxTokenSecret = env.MUX_TOKEN_SECRET;

  if (!url || !service) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }
  if (!muxTokenId || !muxTokenSecret) {
    throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET required");
  }
  if (!existsSync(LOCAL_VIDEO)) {
    throw new Error(`Missing local video: ${LOCAL_VIDEO}`);
  }

  const bytes = readFileSync(LOCAL_VIDEO);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  console.log(
    dryRun
      ? "DRY RUN — no Mux upload or DB writes"
      : `Migrating ${LOCAL_PATH} (${bytes.length} bytes)`,
  );

  const supabase = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error: listError } = await supabase
    .from("project_videos")
    .select(
      "id, project_id, source_path, status, mux_asset_id, mux_playback_id, display_order, title, projects(slug)",
    )
    .not("source_path", "is", null)
    .like("source_path", "/%")
    .is("mux_playback_id", null)
    .order("display_order", { ascending: true });

  if (listError) throw new Error(listError.message);

  const targets = rows ?? [];
  console.log(`Legacy rows to migrate: ${targets.length}`);

  if (targets.length === 0) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      REPORT_PATH,
      `# Phase 13 — Video migration report\n\nNo legacy local video rows found.\n`,
    );
    console.log("Nothing to do.");
    return;
  }

  for (const row of targets) {
    const slug = Array.isArray(row.projects)
      ? row.projects[0]?.slug
      : row.projects?.slug;
    console.log(`- ${slug ?? row.project_id} · ${row.id} · ${row.source_path}`);
  }

  let muxAssetId = null;
  let muxPlaybackId = null;
  let muxUploadId = null;
  const failures = [];

  if (!dryRun) {
    const mux = new Mux({
      tokenId: muxTokenId,
      tokenSecret: muxTokenSecret,
    });

    console.log("Creating Mux direct upload…");
    const upload = await mux.video.uploads.create({
      // Server-side PUT; cors_origin still required by the API.
      cors_origin: "*",
      new_asset_settings: {
        playback_policies: ["public"],
        passthrough: "phase13-shared-placeholder",
      },
      timeout: 3600,
    });

    if (!upload.url || !upload.id) {
      throw new Error("Mux did not return an upload URL/id");
    }
    muxUploadId = upload.id;

    console.log(`Uploading file to Mux (${upload.id})…`);
    await putFile(upload.url, bytes, "video/mp4");

    process.stdout.write("Waiting for asset creation");
    muxAssetId = await waitForUploadAsset(mux, upload.id);
    console.log(`\nAsset created: ${muxAssetId}`);

    process.stdout.write("Waiting for asset ready");
    const asset = await waitForAssetReady(mux, muxAssetId);
    console.log(`\nAsset ready: ${asset.status}`);

    muxPlaybackId = firstPublicPlaybackId(asset.playback_ids);
    if (!muxPlaybackId) {
      throw new Error(`Asset ${muxAssetId} has no public playback id`);
    }
    console.log(`Playback id: ${muxPlaybackId}`);

    for (const [index, row] of targets.entries()) {
      const { error: updateError } = await supabase
        .from("project_videos")
        .update({
          mux_asset_id: muxAssetId,
          mux_playback_id: muxPlaybackId,
          // Unique index on mux_upload_id — only attach to the first shared row.
          ...(index === 0 ? { mux_upload_id: muxUploadId } : {}),
          status: "ready",
          // Keep source_path for rollback until visual verification.
        })
        .eq("id", row.id)
        .is("mux_playback_id", null);

      if (updateError) {
        failures.push({ videoId: row.id, error: updateError.message });
        console.error(`FAIL update ${row.id}: ${updateError.message}`);
      } else {
        console.log(`OK ${row.id}`);
      }
    }
  }

  const mapping = targets.map((row) => {
    const slug = Array.isArray(row.projects)
      ? row.projects[0]?.slug
      : row.projects?.slug;
    return {
      videoId: row.id,
      projectId: row.project_id,
      slug,
      title: row.title,
      displayOrder: row.display_order,
      from: row.source_path,
      muxAssetId,
      muxPlaybackId,
      muxUploadId,
    };
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        dryRun,
        sourceFile: "public/media/videos/CardinTest2.mp4",
        sourcePath: LOCAL_PATH,
        sourceSha256: sha256,
        sourceBytes: bytes.length,
        strategy: "single shared Mux asset for identical placeholder",
        muxAssetId,
        muxPlaybackId,
        muxUploadId,
        mapping,
        failures,
        stillLocal: [
          "public/media/videos/CardinTest2.mp4 — kept until verified",
          "data/projects.ts seed helpers still reference /media/videos/…",
        ],
      },
      null,
      2,
    ),
  );

  const report = [
    "# Phase 13 — Video migration report",
    "",
    `Generated: ${new Date().toISOString()}`,
    dryRun ? "Mode: **dry-run**" : "Mode: live",
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Source file | \`public/media/videos/CardinTest2.mp4\` (${bytes.length} bytes) |`,
    `| SHA-256 | \`${sha256}\` |`,
    `| Legacy rows remapped | ${targets.length} |`,
    `| Shared Mux asset | \`${muxAssetId ?? "(dry-run)"}\` |`,
    `| Shared playback ID | \`${muxPlaybackId ?? "(dry-run)"}\` |`,
    `| Failures | ${failures.length} |`,
    "",
    "## Strategy",
    "",
    "- All seeded videos pointed at the same local MP4 placeholder.",
    "- Uploaded **once** to Mux, then linked every legacy `project_videos` row to that asset.",
    "- Preserved `display_order` and titles.",
    "- Left `source_path` populated for rollback until visual verification.",
    "- Did **not** delete `public/media/videos/CardinTest2.mp4`.",
    "- Skipped CMS uploads already on Mux (`mux_playback_id` set / no local `source_path`).",
    "",
    "## Project mapping",
    "",
    `| Slug | Video ID | From | Playback ID |`,
    `| --- | --- | --- | --- |`,
    ...mapping.map(
      (m) =>
        `| ${m.slug ?? "?"} | \`${m.videoId}\` | \`${m.from}\` | \`${m.muxPlaybackId ?? "-"}\` |`,
    ),
    "",
    "## Failures",
    "",
    failures.length === 0
      ? "_None._"
      : failures.map((f) => `- \`${JSON.stringify(f)}\``).join("\n"),
    "",
    "## Still local",
    "",
    "- `public/media/videos/CardinTest2.mp4` (do not delete until homepage + `/work/[slug]` look correct)",
    "- `data/projects.ts` seed helpers",
    "",
    "## Follow-ups",
    "",
    "- Spot-check video projects on the public site (Mux player).",
    "- After verification, optionally null `source_path` and remove the local MP4 in a cleanup pass.",
    "- Future unique footage should create one Mux asset per row (not shared).",
    "",
  ].join("\n");

  writeFileSync(REPORT_PATH, report);
  console.log(`\nReport: ${REPORT_PATH}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);

  if (failures.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
