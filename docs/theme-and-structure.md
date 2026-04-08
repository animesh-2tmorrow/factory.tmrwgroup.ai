# Theme And Structure

This app uses a tokenized dark system based on the consensus template direction.

## Where to adjust theme

- Core color, spacing, radius, and semantic tokens:
  - `src/styles/vf-tokens.css`
- Reusable UI primitives and layout behavior:
  - `src/app/globals.css`

## Key global primitives

- `vf-card`, `vf-card-pad`, `vf-card-dashed`
- `vf-grid-2`, `vf-grid-3`, `vf-grid-4`, `vf-grid-auto`
- `vf-tabs`, `vf-tab-button`
- `vf-table-wrap`, `vf-table`
- `vf-sidebar`, `vf-header`, `vf-footer`
- `vf-login-shell`, `vf-login-card`

## Structure

- Dashboard pages:
  - `src/app/(dashboard)/**/page.tsx`
- Shared components:
  - `src/components/**`
- Context + infra content sources:
  - `src/lib/context-files.ts`
  - `src/lib/infra-files.ts`

## Styling approach

- Prefer token variables over hardcoded colors.
- Prefer shared primitives over one-off inline style blocks.
- Keep dark contrast high and spacing consistent (`--space-*`).
