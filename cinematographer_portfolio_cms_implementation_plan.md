# Cinematographer Portfolio CMS & Media Storage Implementation Plan

## 1. Purpose

This document defines the implementation plan for adding a custom CMS and scalable media-storage architecture to an existing cinematographer/photographer portfolio website.

The site contains a large amount of photography and video content. The CMS should allow the site owner to manage projects and media without editing code or redeploying the website.

The core architecture should use:

- **Supabase Postgres** for project/content data
- **Supabase Auth** for CMS authentication
- **Supabase Storage** for images and image-related assets
- **Mux** for uploaded video hosting, transcoding, and streaming
- **Vercel** for frontend/application hosting
- **React + TypeScript** for the application
- Existing project UI stack where possible

The implementation must be incremental. Do not attempt to build the entire CMS in a single pass.

---

# 2. High-Level Architecture

```text
                         ┌──────────────────────────┐
                         │ Portfolio Website / CMS  │
                         │ React + TypeScript       │
                         └─────────────┬────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ Supabase Auth   │ │ Supabase DB     │ │ Media Services  │
          │ CMS login       │ │ project data    │ │                 │
          └─────────────────┘ └────────┬────────┘ │ Images →        │
                                      │          │ Supabase Storage │
                                      │          │                 │
                                      │          │ Videos → Mux    │
                                      │          └─────────────────┘
                                      │
                                      ▼
                             Public portfolio query
                                      │
                                      ▼
                         Only published projects
                         rendered on public site
```

The public site should never depend on media files committed to the source repository.

Media should be hosted independently from the frontend deployment.

---

# 3. Architectural Principles

## 3.1 Separate Content Metadata From Media Files

The database stores metadata and references.

Examples:

```text
Project title
Project slug
Project description
Visibility status
Featured status
Display order
Image path / public URL
Mux playback ID
Alt text
Credits
Media ordering
```

The database must **not** store raw image or video binary data.

---

## 3.2 Do Not Store Portfolio Media in `/public`

Do not use:

```text
/public/images
/public/videos
```

for CMS-managed content.

Static UI assets such as logos, icons, or fixed decorative assets may remain in the repository.

Project photography and video should be uploaded through the CMS.

---

## 3.3 Do Not Proxy Large Uploads Through Vercel

Large media files should not be uploaded:

```text
Browser
  ↓
Vercel API
  ↓
Storage
```

Instead use direct uploads:

```text
Browser
  ↓
Authorized upload URL
  ↓
Supabase Storage / Mux
```

The application backend is only responsible for creating an authorized upload request and storing metadata.

---

# 4. Recommended Service Responsibilities

## Supabase Postgres

Responsible for:

- projects
- project metadata
- project image references
- project video references
- ordering
- publish state
- optional tags/categories
- CMS data relationships

---

## Supabase Auth

Responsible for:

- CMS login
- session management
- identifying the site owner/admin
- protecting CMS routes
- protecting database writes
- protecting Storage uploads/deletes

For the initial personal/client CMS, assume one administrator unless requirements change later.

---

## Supabase Storage

Responsible for:

- project images
- cover images
- photography galleries
- optional video poster images
- optional downloadable image assets

Do not use Supabase Storage as the primary streaming solution for portfolio video unless explicitly required later.

---

## Mux

Responsible for:

- original video upload
- video transcoding
- adaptive bitrate streaming
- HLS playback
- video asset processing
- playback IDs
- optional poster/thumbnail generation

Mux should be treated as the application's video CDN/streaming layer.

---

## Vercel

Responsible for:

- hosting the frontend
- application API/server endpoints if applicable
- environment variables
- deployment

Vercel should not become the permanent storage location for project media.

---

# 5. CMS Functional Requirements

The CMS must eventually allow the owner to:

- sign in
- view all projects
- create a project
- edit a project
- delete a project
- publish or hide a project
- mark a project as featured
- control project display order
- upload a project cover image
- upload gallery images
- delete gallery images
- reorder gallery images
- upload videos
- delete videos
- reorder videos
- select poster/thumbnail imagery
- edit title
- edit description
- edit credits
- edit slug
- preview project
- save changes
- publish changes

Do not implement all of these in the first phase.

---

# 6. Suggested Database Schema

## 6.1 `projects`

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  slug text not null unique,
  description text,

  cover_image_path text,

  is_published boolean not null default false,
  is_featured boolean not null default false,

  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Potential future fields:

```text
client
year
location
role
project_type
short_description
seo_title
seo_description
hero_layout
aspect_ratio
```

Do not add fields merely because they may eventually be useful.

Only add fields required by the actual existing portfolio design.

---

# 7. Image Table

## `project_images`

```sql
create table project_images (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references projects(id)
    on delete cascade,

  storage_path text not null,

  alt_text text,
  caption text,

  width integer,
  height integer,

  display_order integer not null default 0,

  created_at timestamptz not null default now()
);
```

Prefer storing the Supabase **storage path** rather than permanently storing a full generated URL.

Example:

```text
projects/550e8400-e29b-41d4-a716-446655440000/gallery/01.webp
```

The application can create the public or transformed URL from the storage path.

This makes it easier to change domains/CDNs later.

---

# 8. Video Table

## `project_videos`

```sql
create table project_videos (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references projects(id)
    on delete cascade,

  mux_asset_id text,
  mux_playback_id text,

  status text not null default 'waiting',

  title text,
  caption text,

  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended video status values:

```text
waiting
uploading
processing
ready
errored
```

The public site must only attempt playback when:

```text
status = 'ready'
```

---

# 9. Optional Unified Media Model

Do **not** begin with this unless the existing site requires arbitrary images and videos to be interleaved in one ordered gallery.

If the project page has content such as:

```text
Image
Image
Video
Image
Video
```

then consider using a unified table later:

```text
project_media

id
project_id
media_type
storage_path
mux_asset_id
mux_playback_id
alt_text
caption
display_order
```

Valid `media_type` values:

```text
image
video
```

For the MVP, separate `project_images` and `project_videos` are easier to reason about.

---

# 10. Storage Bucket Design

Create a Supabase Storage bucket:

```text
portfolio-media
```

Suggested object structure:

```text
portfolio-media/

projects/
  {projectId}/
    cover/
      cover-original.jpg

    gallery/
      {imageId}.jpg
      {imageId}.webp
```

Example:

```text
projects/
  550e8400-e29b-41d4-a716-446655440000/
    cover/
      781f-cover.jpg

    gallery/
      213a.jpg
      872b.jpg
      aa10.jpg
```

Use project IDs rather than project slugs for storage folder identity.

Slugs may change.

Project IDs should not.

---

# 11. Image Upload Flow

The target flow:

```text
CMS
 ↓
User selects image
 ↓
Validate file
 ↓
Generate unique file path
 ↓
Browser uploads directly to Supabase Storage
 ↓
Upload succeeds
 ↓
Create project_images DB record
 ↓
CMS updates immediately
```

Example application flow:

```ts
const filePath =
  `projects/${projectId}/gallery/${crypto.randomUUID()}-${file.name}`;

await supabase.storage
  .from("portfolio-media")
  .upload(filePath, file);

await createProjectImage({
  projectId,
  storagePath: filePath,
});
```

The implementation should include:

- file-size validation
- MIME-type validation
- upload progress
- loading state
- upload failure state
- retry support
- duplicate filename protection

---

# 12. Image Format Strategy

Original professional photography can be extremely large.

The browser should not routinely receive the full original image.

Preferred frontend formats:

```text
AVIF
WebP
JPEG fallback when required
```

The site should request dimensions appropriate for the UI.

Example targets:

### Grid thumbnail

```text
width ≈ 600–900px
```

### Project page image

```text
width ≈ 1400–2000px
```

### Fullscreen/lightbox

```text
width ≈ 2200–3000px
```

Exact sizes should be based on the actual existing layout and device pixel ratio.

Do not blindly serve 5000–8000px originals.

---

# 13. Responsive Images

Public project images should use responsive image behavior.

Example:

```html
<img
  src="..."
  srcset="
    image-800.webp 800w,
    image-1600.webp 1600w,
    image-2400.webp 2400w
  "
  sizes="(max-width: 768px) 100vw, 80vw"
  loading="lazy"
  alt=""
/>
```

If using a framework component such as Next.js `<Image>`, use its optimization pipeline where appropriate.

Do not optimize images twice unnecessarily.

---

# 14. Image Loading Rules

Use:

```text
eager loading
```

only for content visible immediately when the page opens.

Usually:

- hero/cover image → eager
- first project image if visible above fold → possibly eager
- all other gallery images → lazy

Do not eagerly load an entire photography project.

---

# 15. Mux Video Upload Architecture

Video uploads should follow:

```text
CMS
 ↓
Request Mux direct-upload URL
 ↓
Backend securely talks to Mux
 ↓
Backend returns signed/direct upload URL
 ↓
Browser uploads file directly to Mux
 ↓
Mux processes/transcodes file
 ↓
Mux webhook notifies application
 ↓
Database video record becomes "ready"
 ↓
Public site uses playback ID
```

The Mux secret must never be exposed to browser/client JavaScript.

---

# 16. Create Mux Upload Endpoint

Create a secure backend endpoint similar to:

```text
POST /api/mux/uploads
```

Responsibilities:

1. Verify the current user is authenticated.
2. Verify the current user is authorized to use the CMS.
3. Request a direct upload URL from Mux.
4. Create a temporary `project_videos` record.
5. Return:
   - upload URL
   - local video record ID

Example response:

```json
{
  "videoId": "uuid",
  "uploadUrl": "https://storage.googleapis.com/..."
}
```

Do not return:

```text
MUX_TOKEN_SECRET
MUX_TOKEN_ID
```

to the client.

---

# 17. Mux Upload Process

Client-side:

```text
1. User selects video
2. CMS requests direct upload
3. CMS receives upload URL
4. Browser uploads directly to Mux
5. UI shows "Uploading"
6. Upload completes
7. UI shows "Processing"
8. Mux webhook eventually marks video as ready
```

The client must not assume upload completion means the video is immediately playable.

Mux still needs to transcode/process the asset.

---

# 18. Mux Webhook

Create an endpoint:

```text
POST /api/webhooks/mux
```

The endpoint must:

- verify the Mux webhook signature
- inspect event type
- locate the corresponding local video record
- update status
- save `mux_asset_id`
- save `mux_playback_id`

Important events should include equivalent Mux lifecycle events for:

```text
asset ready
asset errored
```

When ready:

```text
status = ready
mux_asset_id = ...
mux_playback_id = ...
```

When processing fails:

```text
status = errored
```

Never trust unsigned webhook payloads.

---

# 19. Video Playback

The public site should render video using the stored playback ID.

Conceptually:

```tsx
<ProjectVideo playbackId={video.mux_playback_id} />
```

Do not store the full playback URL throughout the database.

Store the playback ID and generate the player URL as needed.

---

# 20. Video Poster Images

For initial implementation, use Mux-generated poster/thumbnail support.

Do not require the photographer to upload separate poster images unless the existing design requires precise art direction.

Later, optionally add:

```text
custom_poster_path
poster_time
```

---

# 21. CMS Authentication

The CMS should have a route such as:

```text
/admin
```

or:

```text
/cms
```

Recommended:

```text
/admin/login
/admin/projects
/admin/projects/:id
```

The public website remains:

```text
/
/work
/work/:slug
/about
```

---

# 22. Protecting Admin Routes

CMS routes should require a valid Supabase Auth session.

Pseudo logic:

```ts
if (!session) {
  redirect("/admin/login");
}
```

Do not rely only on hiding links in the UI.

Database/storage permissions must also prevent unauthorized writes.

---

# 23. Supabase Row Level Security

Enable RLS.

Public users should only be able to read published project content.

Conceptual public project policy:

```sql
is_published = true
```

Authenticated admin users should be able to:

```text
SELECT
INSERT
UPDATE
DELETE
```

project data.

For a one-admin CMS, keep policies simple.

Do not make project editing publicly writable.

---

# 24. Public Query Model

The portfolio should not download all draft projects and hide them client-side.

Bad:

```ts
const projects = await getAllProjects();
const visibleProjects = projects.filter(p => p.is_published);
```

Preferred:

```sql
select *
from projects
where is_published = true
order by display_order asc;
```

Only published projects should be returned to the public site.

---

# 25. Draft vs Published State

MVP:

```text
is_published boolean
```

This is sufficient.

CMS behavior:

```text
Published → appears publicly
Draft → remains only in CMS
```

Do not introduce a full revision/publishing system yet.

---

# 26. Project Ordering

Use:

```text
display_order
```

Projects should be queried:

```sql
order by display_order asc
```

When drag-and-drop reordering is implemented, update display order values.

The implementation should not depend on creation date for manual portfolio ordering.

---

# 27. Image Ordering

Each `project_images` row contains:

```text
display_order
```

Gallery query:

```sql
where project_id = ?
order by display_order asc
```

Later implement drag-and-drop ordering in the CMS.

---

# 28. Video Ordering

Use the same pattern:

```text
display_order
```

Do not infer ordering from Mux upload date.

---

# 29. Project Delete Behavior

Deleting a project should eventually clean up:

```text
project DB record
project image DB rows
Supabase Storage objects
Mux video assets
```

Foreign keys can remove associated DB rows.

External storage still requires explicit cleanup.

Do not implement destructive cleanup until normal project CRUD is stable.

---

# 30. CMS UI Structure

Suggested information architecture:

```text
Admin
│
├── Login
│
└── Projects
    │
    ├── Project List
    │
    └── Project Editor
        │
        ├── Details
        ├── Cover
        ├── Images
        ├── Videos
        ├── Settings
        └── Preview
```

---

# 31. Project List UI

Initial page:

```text
Projects

[ + New Project ]

────────────────────────────────

Nike — Air Max
Published
Featured
Edit

Short Film — Solitude
Draft
Edit

Portrait Series
Published
Edit
```

Later enhance to:

```text
thumbnail
drag handle
project title
status
featured state
last updated
quick publish toggle
edit action
```

Do not begin with a complex data table unless the design benefits from one.

---

# 32. Project Editor

Recommended initial form fields:

```text
Title
Slug
Description
Published
Featured
```

Then add media sections.

Avoid building every possible content field before validating the CMS workflow.

---

# 33. Slug Handling

When creating a project:

```text
Nike Air Max
```

generate:

```text
nike-air-max
```

The CMS must check slug uniqueness.

Users may manually override the slug.

Changing the slug may change the project's public URL.

---

# 34. Cover Image Management

A project should have one cover image.

Recommended implementation:

```text
projects.cover_image_path
```

Flow:

```text
Upload cover
 ↓
Supabase Storage
 ↓
Save storage path in project row
```

Replacing the cover should eventually remove the previous unused storage object.

For MVP, prioritize reliable replacement before automatic cleanup.

---

# 35. Gallery Image Management

The UI should support:

```text
Upload Images
```

Multiple image selection should eventually be supported.

Each successful upload creates one `project_images` record.

CMS gallery UI:

```text
┌─────────┐ ┌─────────┐ ┌─────────┐
│ image 1 │ │ image 2 │ │ image 3 │
│    ⋮    │ │    ⋮    │ │    ⋮    │
└─────────┘ └─────────┘ └─────────┘
```

Actions:

```text
delete
edit alt text
edit caption
reorder
```

---

# 36. Accessibility

Every meaningful photograph should support:

```text
alt_text
```

The CMS should allow the owner to set this.

Decorative imagery may intentionally use empty alt text.

Do not automatically use the filename as final alt text.

---

# 37. CMS Upload UX

All upload components should display distinct states.

Images:

```text
Ready
Uploading
Uploaded
Failed
```

Videos:

```text
Ready
Uploading
Processing
Ready to play
Failed
```

Do not use one indefinite spinner for the entire workflow.

---

# 38. Upload Progress

Large videos require visible progress.

The video uploader should display:

```text
filename
size
upload percentage
upload status
processing status
error message
retry action
```

This is especially important for multi-gigabyte source footage.

---

# 39. File Validation

## Images

Initially support:

```text
image/jpeg
image/png
image/webp
```

Potential later support:

```text
image/avif
```

HEIC should not be assumed to work everywhere without a conversion pipeline.

---

## Video

Initial support should align with Mux-supported upload formats.

Common expected files:

```text
.mp4
.mov
```

Do not build custom transcoding inside the application.

Mux is responsible for this.

---

# 40. Environment Variables

Possible variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=
```

If using Next.js rather than Vite, use the appropriate public/private naming conventions.

Rules:

```text
Supabase public URL → client-safe
Supabase anon key → client-safe
Supabase service role → server only
Mux token ID → server only
Mux token secret → server only
Mux webhook secret → server only
```

Never expose service-role credentials in frontend bundles.

---

# 41. Application Data Types

Create explicit TypeScript types.

Example:

```ts
export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImagePath: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  storagePath: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  displayOrder: number;
}

export interface ProjectVideo {
  id: string;
  projectId: string;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  status: "waiting" | "uploading" | "processing" | "ready" | "errored";
  title: string | null;
  caption: string | null;
  displayOrder: number;
}
```

Prefer generated Supabase database types where practical.

---

# 42. Recommended Service Layer

Do not scatter Supabase queries throughout React components.

Suggested structure:

```text
src/
  services/
    projects/
      getProjects.ts
      getProject.ts
      createProject.ts
      updateProject.ts
      deleteProject.ts

    images/
      uploadProjectImage.ts
      deleteProjectImage.ts

    videos/
      createMuxUpload.ts
```

Or organize by feature if the existing codebase already follows feature folders.

Respect the existing project's architecture rather than forcing this exact folder layout.

---

# 43. Public Data Queries

Provide dedicated queries/functions:

```ts
getPublishedProjects()
getPublishedProjectBySlug(slug)
```

Admin:

```ts
getAllProjects()
getProjectById(id)
createProject()
updateProject()
deleteProject()
```

Do not reuse admin queries for the public site.

---

# 44. Caching

Public project data is highly cacheable.

Potential caching:

```text
project list
project detail
image URLs
video manifests
```

CMS data should generally favor freshness.

Do not introduce complex caching until the core CMS works.

---

# 45. Error Handling

Every data mutation should handle failure.

Examples:

```text
Project failed to save.
Image failed to upload.
Video processing failed.
Project failed to publish.
```

Avoid silent failures.

The CMS should preserve unsaved user input where reasonable.

---

# 46. Optimistic UI

Do not begin by aggressively using optimistic updates.

Use confirmed server responses for:

```text
create
delete
publish
media operations
```

Once stable, optimistic UI may be added for:

```text
reordering
small metadata edits
visibility toggles
```

---

# 47. Security Requirements

The implementation must:

- use Supabase RLS
- prevent public DB writes
- restrict Storage writes
- keep Mux credentials server-side
- keep Supabase service role server-side
- verify Mux webhook signatures
- validate uploaded MIME types
- validate upload sizes
- sanitize/validate CMS form input
- avoid exposing admin-only unpublished data

Security must not rely only on React route guards.

---

# 48. Performance Requirements

Public portfolio pages must:

- lazy-load below-the-fold images
- use appropriately-sized images
- use optimized image formats
- avoid loading hidden projects
- avoid loading entire galleries on listing pages
- avoid autoplaying multiple high-resolution videos simultaneously
- use Mux adaptive streaming
- avoid shipping original photography unnecessarily

---

# 49. Homepage Loading Strategy

Homepage project cards should query only required data:

```text
id
title
slug
cover_image_path
```

Do not fetch:

```text
entire image gallery
video metadata
large descriptions
```

until the user opens the project.

---

# 50. Project Page Loading Strategy

Project page:

```text
project
 ↓
project metadata
 ↓
ordered project images
 ↓
ordered project videos
```

Load media progressively.

If the design shows many videos, video players should not all aggressively buffer on initial render.

---

# 51. Deployment Architecture

```text
GitHub
  ↓
Vercel
  ↓
Application

Supabase
├── Auth
├── Database
└── Image Storage

Mux
└── Video

DNS
└── portfolio-domain.com
```

A content change should not require:

```text
git commit
git push
Vercel deploy
```

The CMS should update database/storage state immediately.

---

# 52. Development Phases

The implementation must follow these phases.

Do not skip directly to media uploads.

---

# Phase 0 — Audit Existing Portfolio

## Goal

Understand how the current site represents projects before changing architecture.

## Tasks

- inspect existing project types/interfaces
- find hardcoded project data
- find hardcoded image imports
- find video references
- identify all project-list views
- identify all project-detail views
- document current project fields
- identify router strategy
- identify framework
- identify existing backend/API usage
- identify existing Supabase configuration if any

## Deliverable

Create:

```text
docs/cms-existing-architecture.md
```

Document:

```text
existing project data structure
current media paths
affected components
migration risks
recommended implementation mapping
```

## Cursor Prompt

```text
Audit the existing portfolio application before implementing the CMS.

Do not modify production code yet.

Identify:
- where project data currently lives
- every Project-related TypeScript type
- every component that displays projects
- all image/video references
- how routing works
- whether Supabase already exists
- whether the project is Vite React, Next.js, or another framework
- existing API/data-access patterns
- current environment variable conventions

Create docs/cms-existing-architecture.md with your findings.

At the end, propose how the existing project model maps to the planned Supabase projects, project_images, and project_videos tables.

Do not implement the CMS yet.
```

---

# Phase 1 — Supabase Foundation

## Goal

Establish Supabase without changing the visible website.

## Tasks

- add Supabase SDK
- configure environment variables
- create Supabase client
- create database migration
- create `projects`
- create `project_images`
- create `project_videos`
- enable RLS
- add initial policies

## Deliverable

Existing site still behaves exactly as before.

Supabase infrastructure exists.

## Cursor Prompt

```text
Implement Phase 1 of the CMS architecture.

Use the architecture defined in this document and the findings in docs/cms-existing-architecture.md.

Set up Supabase for the project.

Create migrations for:
- projects
- project_images
- project_videos

Enable Row Level Security.

Add policies so:
- anonymous/public users can only read published projects
- anonymous users cannot write
- authenticated CMS admin users can manage projects and associated media rows

Add the Supabase client following the existing application's architecture.

Add TypeScript types.

Do not migrate the current project content yet.
Do not build the CMS UI yet.
Do not add Mux yet.
Do not visually change the existing website.

Document any required environment variables in .env.example.
```

---

# Phase 2 — Move Public Project Data to Supabase

## Goal

Replace hardcoded project metadata with database content.

## Tasks

- seed/migrate current project metadata
- create public project queries
- adapt homepage/project listing
- adapt project detail pages
- preserve current visual design

Images may temporarily still reference existing static URLs during this phase.

## Cursor Prompt

```text
Implement Phase 2.

Move the existing project metadata into Supabase.

Create a migration or seed strategy that reproduces the currently visible portfolio projects.

Create:
- getPublishedProjects()
- getPublishedProjectBySlug()

Replace hardcoded project metadata on the public site with these queries.

The public site's appearance and behavior should remain unchanged.

Only published projects should be returned publicly.

Do not build the CMS yet.
Do not migrate image files yet.
Do not add Mux yet.

Verify that:
- existing project URLs continue to work
- project ordering is preserved
- project titles/descriptions are preserved
- unpublished projects cannot be retrieved through normal public queries
```

---

# Phase 3 — CMS Authentication

## Goal

Create secure administrator access.

## Tasks

- Supabase Auth
- login screen
- logout
- protected routes
- CMS layout

Suggested routes:

```text
/admin/login
/admin/projects
```

## Cursor Prompt

```text
Implement Phase 3: CMS authentication.

Create an admin area under /admin.

Implement:
- /admin/login
- authentication with Supabase Auth
- authenticated session handling
- logout
- protected /admin routes
- a minimal admin layout

Do not build the full project editor yet.

The /admin/projects route can initially contain a simple placeholder confirming that the user is authenticated.

Do not expose Supabase service-role credentials to the browser.

Keep public portfolio behavior unchanged.
```

---

# Phase 4 — Project List CMS

## Goal

Allow the owner to see and manage project visibility.

## Tasks

Create CMS project list.

Display:

```text
title
published/draft
featured
display order
edit
```

Implement:

```text
create project
publish/unpublish
feature/unfeature
```

## Cursor Prompt

```text
Implement Phase 4: the CMS project list.

At /admin/projects:

- fetch all projects, including drafts
- display project title
- display Published/Draft state
- display Featured state
- provide Edit action
- provide New Project action
- allow Publish/Unpublish
- allow Featured toggle

Use the project's existing component/UI system.

Do not implement image upload yet.
Do not implement Mux yet.
Do not implement drag-and-drop ordering yet.

All writes must go through authenticated/authorized Supabase access.

The public site should immediately reflect publish/unpublish changes.
```

---

# Phase 5 — Project Editor

## Goal

Edit project metadata.

## Fields

Initial:

```text
title
slug
description
is_published
is_featured
```

## Cursor Prompt

```text
Implement Phase 5: project editing.

Create:

/admin/projects/:projectId

Support editing:
- title
- slug
- description
- published state
- featured state

Requirements:
- validate required fields
- enforce/handle slug uniqueness
- show save loading state
- show save success state
- show meaningful failure messages
- preserve typed form state if the save fails

Also support creating a new project.

Do not add image uploads yet.
Do not add Mux yet.
```

---

# Phase 6 — Supabase Image Storage

## Goal

Move project photography to managed storage.

## Tasks

- create `portfolio-media` bucket
- storage policies
- cover-image upload
- gallery uploads
- image DB rows
- delete images
- image URL utility

## Cursor Prompt

```text
Implement Phase 6: Supabase image storage.

Create/configure a Supabase Storage bucket named portfolio-media.

Storage structure should follow:

projects/{projectId}/cover/
projects/{projectId}/gallery/

Implement authenticated CMS image uploads.

Add:
- cover image upload
- gallery image upload
- upload progress
- validation
- error handling

Store Storage paths in the database instead of hardcoding full URLs wherever practical.

Create a reusable utility for generating usable image URLs from storage paths.

Do not add Mux yet.
Do not add drag-and-drop ordering yet.

Ensure public users can read media needed by published projects but cannot upload, replace, or delete files.
```

---

# Phase 7 — Migrate Existing Images

## Goal

Remove CMS-managed project imagery from the repository.

## Tasks

- inventory static project images
- upload to Storage
- connect DB rows
- replace static imports
- verify visual fidelity
- avoid deleting originals until validated

## Cursor Prompt

```text
Implement Phase 7: migrate existing project images into Supabase Storage.

Use the existing architecture audit to identify all project-specific images currently stored in the repository.

Create a safe migration strategy.

Requirements:
- upload existing project images into the correct project Storage folders
- populate cover_image_path
- create project_images rows
- preserve current ordering
- preserve current project appearance
- replace static project-image imports with Storage-backed data

Do not delete the original local media files until all migrated content has been verified.

Produce a migration report documenting:
- files migrated
- project mapping
- failures
- files that are still referenced locally
```

---

# Phase 8 — Image CMS Improvements

## Goal

Make image management usable.

## Tasks

- image thumbnails
- delete
- edit alt text
- edit caption
- reorder
- cover replacement
- multiple upload

## Cursor Prompt

```text
Implement Phase 8: improve project image management.

Within the project editor:

- display gallery thumbnails
- support multiple image upload
- support image deletion
- support alt-text editing
- support caption editing
- support cover-image replacement
- add drag-and-drop gallery ordering
- persist display_order

Use a stable drag-and-drop library only if one is already present or clearly justified.

Ensure image reordering does not require re-uploading files.

Keep the visual implementation consistent with the existing application.
```

---

# Phase 9 — Mux Foundation

## Goal

Connect the application to Mux securely.

## Tasks

- Mux SDK/server integration
- create direct upload endpoint
- create local video row
- secure server credentials

## Cursor Prompt

```text
Implement Phase 9: Mux foundation.

Add Mux server-side integration.

Create a secure endpoint for generating Mux direct-upload URLs.

Requirements:
- endpoint requires authenticated CMS user
- Mux credentials remain server-only
- create a project_videos database record before/when upload begins
- return the local video ID and direct-upload URL
- associate uploads with the correct project

Do not implement public video playback yet.
Do not implement webhook handling yet unless needed for a minimal working upload test.

Document new environment variables in .env.example.
```

---

# Phase 10 — Video Upload UI

## Goal

Allow the owner to upload footage.

## Tasks

- file picker
- direct upload
- progress
- upload state
- processing state

## Cursor Prompt

```text
Implement Phase 10: CMS video uploads.

Add a video section to the project editor.

Allow authenticated users to:
- choose a supported video
- request a Mux direct-upload URL
- upload directly from the browser to Mux
- view upload progress

Represent video states clearly:
- waiting
- uploading
- processing
- ready
- errored

Do not treat upload completion as playback readiness.

Keep large video data out of Vercel/server request bodies.
```

---

# Phase 11 — Mux Webhooks

## Goal

Synchronize Mux processing state.

## Tasks

- webhook endpoint
- signature verification
- update DB
- ready state
- errors

## Cursor Prompt

```text
Implement Phase 11: Mux webhook synchronization.

Create the application's Mux webhook endpoint.

Requirements:
- verify Mux webhook signatures using the configured webhook secret
- reject invalid webhook requests
- map Mux assets to project_videos records
- update mux_asset_id
- update mux_playback_id
- set status to ready when processing completes
- set status to errored when processing fails

Make webhook handling idempotent where possible.

Do not trust unsigned event payloads.
```

---

# Phase 12 — Public Video Playback

## Goal

Replace static portfolio video files with adaptive streaming.

## Tasks

- player component
- Mux playback
- poster
- lazy loading
- preserve design

## Cursor Prompt

```text
Implement Phase 12: public Mux video playback.

Create or update the portfolio video component so project videos use mux_playback_id.

Requirements:
- only render playable video when status is ready
- use Mux adaptive streaming
- integrate poster/thumbnail support
- preserve the existing portfolio visual design
- avoid eagerly loading/buffering every video on the page
- support existing responsive layouts

Do not autoplay multiple videos simultaneously unless the original design explicitly requires it.
```

---

# Phase 13 — Migrate Existing Videos

## Goal

Remove large portfolio video content from application hosting.

## Cursor Prompt

```text
Implement Phase 13: migrate existing portfolio videos to Mux.

Identify every project video currently hosted statically or through the existing media solution.

Create a safe migration process.

For each video:
- associate it with the correct project
- upload/import it into Mux
- populate project_videos
- preserve display ordering
- update the public project to use Mux playback

Do not remove the original video files until migrated playback has been verified.

Create a migration report.
```

---

# Phase 14 — Project Ordering

## Goal

Allow drag-and-drop organization of the portfolio.

## Cursor Prompt

```text
Implement Phase 14: project reordering.

Add drag-and-drop project ordering to /admin/projects.

Persist the new order using projects.display_order.

Requirements:
- reorder without reloading the page
- show clear pending/saving state
- recover gracefully if persistence fails
- public project ordering must reflect the stored order

Do not use creation timestamp as the primary ordering mechanism.
```

---

# Phase 15 — Project Delete & Media Cleanup

## Goal

Safely remove projects and associated external media.

Deletion must be deliberate.

Suggested flow:

```text
Delete Project
 ↓
Confirmation dialog
 ↓
Delete Supabase images
 ↓
Delete Mux assets
 ↓
Delete DB project
```

Consider partial-failure handling.

## Cursor Prompt

```text
Implement Phase 15: safe project deletion.

Before implementation, inspect the current storage and video service APIs.

Add a destructive project-delete action with explicit confirmation.

Deletion should clean up:
- project images from Supabase Storage
- Mux assets
- project_images rows
- project_videos rows
- project row

Handle partial failures carefully.

Do not leave the CMS claiming deletion succeeded when external assets failed to delete.

Log/report cleanup failures in a way the administrator can understand.
```

---

# Phase 16 — Performance Pass

## Goal

Optimize the public portfolio after migration.

## Tasks

Audit:

```text
image dimensions
image formats
LCP
lazy loading
video buffering
query payload size
duplicate requests
gallery loading
```

## Cursor Prompt

```text
Perform a focused performance audit of the portfolio after the CMS/media migration.

Do not redesign the site.

Evaluate:
- homepage project query size
- cover-image sizing
- responsive image behavior
- image lazy loading
- LCP image behavior
- project gallery loading
- Mux video loading/buffering
- duplicate data requests
- unnecessary media fetched before visibility

Make targeted improvements.

Prioritize visual quality appropriate for a professional cinematographer/photographer portfolio while preventing unnecessary multi-megabyte transfers.
```

---

# Phase 17 — CMS UX Polish

## Goal

Make the CMS comfortable for a non-developer.

Improve:

```text
empty states
upload feedback
save feedback
confirmation dialogs
drag-and-drop
thumbnail previews
processing states
error states
responsive admin layout
```

Do not spend time building an elaborate design system if the existing application already has one.

---

# 53. Data Migration Rule

When converting the existing site:

```text
DO NOT:
Delete static content first
and then attempt migration.
```

Use:

```text
1. Add new architecture
2. Copy/migrate content
3. Verify new content
4. Switch application references
5. Verify production
6. Remove old assets
```

This prevents accidental loss of portfolio content.

---

# 54. Git Workflow Recommendation

Each phase should be implemented as a separately reviewable change.

Examples:

```text
feat/cms-supabase-foundation
feat/cms-auth
feat/cms-project-editor
feat/cms-image-storage
feat/cms-mux
```

Commits should stay scoped.

Avoid one massive:

```text
"implement CMS"
```

commit.

---

# 55. Cursor Agent Rules

These rules should be provided to Cursor for the project.

```text
CMS IMPLEMENTATION RULES

1. Read this implementation plan before changing CMS/media architecture.

2. Implement only the requested phase.

3. Do not jump ahead into later phases unless a dependency absolutely requires it.

4. Preserve the existing public visual design unless explicitly instructed otherwise.

5. Reuse existing UI components and architectural patterns.

6. Do not introduce a large dependency without explaining why it is required.

7. Do not store project media inside the application repository.

8. Never expose:
   - SUPABASE_SERVICE_ROLE_KEY
   - MUX_TOKEN_SECRET
   - MUX_WEBHOOK_SECRET
   in browser code.

9. Use direct-to-storage uploads for large media.

10. Keep image and video storage concerns separate.

11. Store media references/paths in Postgres, not media binary data.

12. Public users may only access published portfolio content.

13. CMS write operations require authentication and authorization.

14. Enable and respect Supabase Row Level Security.

15. Never rely solely on frontend route guards for security.

16. Preserve existing routes and project URLs where possible.

17. Do not remove old media before successful migration verification.

18. Do not optimize prematurely.

19. Prefer simple, explicit database structures.

20. Do not create unnecessary abstractions.

21. Keep Supabase calls out of presentation components where practical.

22. Use existing error/loading component patterns.

23. Add useful TypeScript types rather than using `any`.

24. Validate file type and file size before uploads.

25. Clearly distinguish video upload state from Mux processing state.

26. Verify webhook signatures.

27. Avoid silently swallowing failed uploads or database mutations.

28. Keep public project queries smaller than admin queries.

29. Never fetch draft projects and merely hide them on the public client.

30. Before completing each phase:
    - run TypeScript checks
    - run linting
    - run relevant existing tests
    - manually verify the changed workflow
```

---

# 56. Recommended Initial Scope

The first meaningful CMS milestone should be:

```text
Supabase configured
        ↓
Existing project metadata migrated
        ↓
Admin login
        ↓
Project list
        ↓
Project editor
        ↓
Publish / unpublish
```

At this point the owner can already control which projects appear publicly.

Then proceed to:

```text
Image uploads
        ↓
Image migration
        ↓
Mux uploads
        ↓
Video migration
```

This order avoids combining:

```text
CMS
database migration
authentication
image infrastructure
video infrastructure
```

into one risky implementation.

---

# 57. MVP Completion Definition

The CMS MVP is complete when the owner can:

```text
log into /admin
create a project
edit its metadata
upload a cover image
upload gallery images
upload a video
wait for video processing
publish the project
see it on the public site
hide it again
reorder projects
```

without:

```text
opening VS Code/Cursor
changing source files
committing media
running Git
redeploying Vercel
```

---

# 58. Later Enhancements

Do not implement these during MVP unless explicitly requested.

Potential future features:

```text
scheduled publishing
draft preview links
project duplication
revision history
project categories
tags
client metadata
year filtering
bulk image upload
bulk project editing
automatic alt-text suggestions
image focal points
custom crop control
custom video poster frame
video trimming
analytics
SEO editor
OpenGraph image selection
project password protection
private client galleries
downloadable original files
multiple CMS users
roles/permissions
activity log
autosave
content versioning
```

---

# 59. Final Target Architecture

```text
                            PUBLIC VISITOR
                                  │
                                  ▼
                         Portfolio Frontend
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
             Supabase Postgres             Media Delivery
             Published content             │
                                           ├── Images
                                           │   Supabase Storage/CDN
                                           │
                                           └── Video
                                               Mux


                              ADMIN USER
                                  │
                                  ▼
                              /admin
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
                    ▼             ▼              ▼
              Supabase Auth   Postgres      Media Upload
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                            Supabase Storage          Mux Direct Upload
                               Images                    Video
```

---

# 60. Implementation Priority

Use this order unless the existing codebase forces a small adjustment:

```text
1. Audit existing project architecture
2. Supabase foundation
3. Public DB-backed project content
4. CMS authentication
5. CMS project list
6. CMS project editor
7. Supabase image storage
8. Existing image migration
9. Image management UX
10. Mux foundation
11. Video uploads
12. Mux webhook
13. Public Mux playback
14. Existing video migration
15. Project/media ordering
16. Safe deletion
17. Performance optimization
18. CMS UX polish
```

The core principle is:

> Build the content-management workflow first, then progressively move media ownership out of the application repository and into dedicated storage/streaming infrastructure.

