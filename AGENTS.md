# Project Instructions

## Product

This is a visual-first portfolio website for a photographer and videographer.

The public site prioritizes:

1. Visual fidelity
2. Performance
3. Accessibility
4. Responsive behaviour
5. Maintainable content structures

## Technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase later in the project

## Architecture

- Pages and layouts are Server Components by default.
- Add `"use client"` only when browser interactivity requires it.
- Keep reusable components in `src/components`.
- Keep mock content in `src/data` until Supabase is introduced.
- Do not add dependencies without explaining why.
- Do not introduce global state unless clearly necessary.
- Do not connect Supabase during the initial homepage milestone.

## Component standards

- Use semantic HTML.
- Components must be keyboard accessible.
- Images require meaningful alt text unless decorative.
- Avoid fixed heights where content could overflow.
- Keep components focused and composable.
- Prefer props and composition over duplicated markup.
- Define explicit TypeScript types.
- Do not use `any`.

## Styling

- Use design tokens defined in `globals.css`.
- Follow the Figma spacing and typography specifications.
- Avoid arbitrary styling values when a token exists.
- Build mobile-first.
- Respect `prefers-reduced-motion`.
- Do not invent decorative effects not present in the approved design.

## Workflow

Before implementing a task:

1. Inspect relevant files.
2. Explain the proposed changes.
3. Identify uncertainties.
4. Implement only the requested scope.
5. Run linting and type checking.
6. Summarize changed files and remaining concerns.

## Commands

- Development: `npm run dev`
- Lint: `npm run lint`
- Build validation: `npm run build`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
