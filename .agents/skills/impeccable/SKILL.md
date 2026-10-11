---
name: impeccable
description: Design language and craft floor by Paul Bakaus (pbakaus/impeccable). Detects and eliminates AI-slop, bans repetitive kicker/eyebrow badges, enforces intentional hierarchy, zero-offset halo bans, typography balance, and authentic human-crafted interface aesthetics.
metadata:
  version: 4.4.0
---

# Impeccable Design & Anti-Slop Craft Floor

## 1. What to Refuse (Banned AI-Slop Anti-Patterns)
- **Banned: The Repetitive Pill-Shaped Eyebrow / Kicker Badge**. Stamping `[Icon] Category Name` in a rounded-full pastel capsule above every single heading is the #1 hallmark of AI-generated templates. Ban it. Put category context into the headline itself, a clean breadcrumb, or omit it.
- **Banned: Identical Three-Card Grids**. Same-size cards of icon plus heading plus text as the default page structure everywhere.
- **Banned: Zero-Offset Colored Glow Halos**. Real depth uses subtle directional shadows (`0 1px 3px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)`), not radioactive glowing halos.
- **Banned: Hero-Metric Template**. Big giant number, tiny label, supporting stats forced into repetitive cards.
- **Banned: Generic Unbalanced Colors**. Multiple conflicting gradients, random shades of green/blue clashing.

## 2. What to Enforce (Human-Crafted Production Excellence)
- **Contrast**: Body text ≥ 4.5:1, large headings ≥ 3:1.
- **Typography**: `text-wrap: balance` on headings, `text-wrap: pretty` on descriptions, `tabular-nums` on numbers/stats.
- **Depth**: Layered transparent shadows, clean hairline borders (`border-slate-200/80`), subtle 1px image edge outlines.
- **Controls**: Tactile scale on press (`active:scale-[0.96]`), optical alignment on button icons (`ps-4 pe-3.5`).
- **Dynamic Truth**: Never hard-code status badges (like "PPDB Dibuka") if the database has dynamic status. Tie UI to dynamic state.
