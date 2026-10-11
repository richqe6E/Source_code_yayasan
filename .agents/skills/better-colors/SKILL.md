---
name: better-colors
description: Helps you build a color system and answer anything about color in your project. You can generate palettes, use semantic tokens, convert between formats, check contrast and more.
---

# Colors

A color system is a small set of ramps, named by role and verified against the backgrounds they actually render on.

## 1. Ramps, not arbitrary colors
- One neutral ramp (`slate` or `zinc`).
- One primary accent ramp (`emerald` for Yayasan Samarinda).
- Distinct status ramps only when rendered (`amber` for pending/warning, `rose` for danger/unpaid, `emerald` for success/paid, `sky` for informational).

## 2. Every step has a job
- `50`: Page / section background or subtle tint.
- `100`: Component background, hover states on soft tags.
- `200`: Subtle border, active card surface.
- `300`: Stronger border, divider.
- `400` / `500`: Primary interactive elements, icons.
- `600`: Hover states for primary elements.
- `700` / `800`: Secondary text, subheadings.
- `900` / `950`: Primary body text and headlines.

## 3. One color, one meaning
- Accent color (emerald) means primary brand and key interactive actions. Don't use primary accent randomly on static decorations if it makes them look clickable.
- Keep status colors consistent across all portals (student, parent, admin, PPDB).
