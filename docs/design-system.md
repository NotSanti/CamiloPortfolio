# Design System

Source: Figma `Caloid-Portfolio` → `MainPage` (`2:2`), a 1440 × 1024 desktop frame.

Last synced from Figma: 2026-08-05 (About `19:16` + Projects overlay `19:42`).

## Typography

Site-wide typeface: **PP Neue Montreal** (licensed; load from `/public/fonts`).

Figma usage:

- Display / brand wordmark: PP Neue Montreal Bold, 128px, uppercase (`CALOID` / project titles).
- Contact name: PP Neue Montreal Bold, 96px, uppercase stacked `CAMILO` / `LUNA`.
- Intro header: PP Neue Montreal Bold, 24px, uppercase.
- Navigation: PP Neue Montreal Medium, 32px, uppercase (`PROJECTS`, `-`, `ABOUT`).
- About body: PP Neue Montreal Medium, 24px; selected words use accent `#CF0023`.
- Projects list labels: PP Neue Montreal Medium, 36px, uppercase, accent.
- Contact link labels: PP Neue Montreal Medium, ~96px, uppercase, accent.
- Line height: automatic / normal. Letter spacing: none.

### Font files required

Place licensed files in `public/fonts/` (current filenames):

- `ppneuemontreal-medium.woff2` (weight 500)
- `ppneuemontreal-bold.woff2` (weight 700)
- `ppneuemontreal-book.woff2` (weight 400, optional)

## Colors

- Background: `#FFFFFF`.
- Foreground: `#000000` (media labels / default body).
- Accent / brand text: `#CF0023` (intro, navigation, `CALOID`, project titles, list, accents in about copy, contact CTAs).
- Previous accent `#FE5757` is **deprecated** (replaced by `#CF0023`).
- Media placeholder: `#D9D9D9`.
- Contact button border: `#CF0023`, fill white/transparent, radius 20px.
- Projects scrollbar track: `#E5E5E5`; thumb: `#CF0023`; width 10px; radius 20px.

## Spacing

Use an 8px base scale (`8, 16, 24, 32, 48, 64, 96`) for structural UI spacing.

Homepage media stream uses **2rem** left/right gutters where tiles cannot render.

## Layout

### Homepage (`MainPage` `2:2`)

- Intro header top-left; `CALOID` bottom-right; vertical `PROJECTS - ABOUT` nav.
- Overflow: media may clip past the top edge.

### Project pages

- Photo carousel / expanded photo / video layouts (see prior sync).
- Shared: vertical nav + bottom-right project title; no homepage intro / `CALOID`.

### About (`AbountPage` `19:16`)

- Nav on About is `PROJECTS - HOME` (Projects opens the overlay; Home links to `/`).
- Bio paragraph top-left (accent Bold ≈20px / 44px line-height).
- Center stack: “WHY IS HE CALLED CALOID?” repeated with overlapping lines (accent Bold ≈24px).
- Contact column top-right: `CONTACT` + Email / Instagram / LinkedIn links (accent).
- Landscape portrait placeholder bottom-left (~465 × 268).
- Large `ABOUT` wordmark bottom-right (128px Bold accent), same treatment as project titles / `CALOID`.

### Projects list (`ProjectsPage` `19:42`)

Figma design note: **not a standalone surface** — rendered as a full-viewport overlay (opaque white). Closing it does not remount the underlying page.

- Solid white background (no blur / transparency of the page underneath).
- Red circular close control top-left (≈30px, accent fill); Escape also closes.
- **Renderable area** is a funnel from the **top of the viewport** to the bottom (full width at top 0%–100%, wider taper at bottom ≈22%–78%), from Figma `Renderable List Borders` (`19:86`), extended to `y: 0` and full-bleed at the top.
- **Non-renderable area** guide lines are design-only and are **not** shown in the UI.
- Project titles are scattered randomly inside the funnel (stable per project id).
- Scrolling is on a full-viewport container; the funnel only clips title visibility.
- Projects opens as an overlay on **whatever page the user is on** (home, about, or a project); it does not navigate away.
- Project titles link to `/work/[slug]`.

## Breakpoints

Figma only defines 1440px desktop frames. Implementation recommendations:

- Mobile: `< 768px`.
- Tablet: `768–1023px`.
- Desktop: `≥ 1024px`.

## Media ratios

- Homepage stream tiles and project carousel tiles derive from each media item’s `width` / `height`.
- Stream display size: short side ≈ 160px.
- Photo carousel row height ≈ 459px; filmstrip row height ≈ 105px.
- Projects are typed `kind: "photo" | "video"`.

## Motion principles

- Homepage: media fade-in on enter; vertical bottom→top recycle stream; hover pauses stream, scales the tile (~1.06), dims sibling tiles, and veils the rest of the page (~40% black).
- Photo project: continuous horizontal carousel scroll; pauses on hover/focus; reduced-motion disables auto-scroll.
- Projects overlay: opaque white full-viewport surface; red circular close control top-left.
- Image hover: Soft shadow + slight scale on the focused tile; cursor-following `OPEN PROJECT` label (mouse only).
- Navigation transition: seamless ~450ms crossfade between routes (View Transitions); disabled when `prefers-reduced-motion` is set.

## Changelog (Figma sync)

- Accent red updated from `#FE5757` to `#CF0023`.
- Typeface changed from Inter to PP Neue Montreal (Medium + Bold).
- `CALOID` moved from vertical right-rail display to large horizontal bottom-right wordmark.
- Right rail is now nav-only: `PROJECTS - ABOUT` in accent Medium.
- Added top-left intro: “Montreal based photographer & cinematographer” / “Camilo Luna”.
- Added photo project carousel + expanded selected-photo view.
- Added video project single-player layout.
- About rebuilt (`19:16`): bio, overlapping slogan stack, contact links, landscape photo, `ABOUT` wordmark.
- Projects overlay rebuilt (`19:42`): opaque white; red close circle; funnel title list retained.
