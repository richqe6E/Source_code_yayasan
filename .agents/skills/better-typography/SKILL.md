---
name: better-typography
description: Focuses on type scale, spacing, sizing, variable fonts, OpenType features, wrapping, truncation and other details that make typography feel great across your product.
---

# Typography

Typography is mostly restraint: a sensible scale, comfortable spacing, enough contrast. A label, a table cell, a marketing headline and an article paragraph do not share one set of rules.

## 1. Fewer fonts, sizes and weights
Rarely use more than two to three fonts. Weight and size define hierarchy; overusing them hurts readability. Pair for contrast, not similarity.
Below `18px`, stay at weight `400` or heavier. Weights under `300` are display-only at `28px`+; they disappear at body text sizes.

## 2. Line-height by role
- Headings: tighter line-height, around `1.1` to `1.25` (`leading-tight` or `leading-snug`).
- Body copy: `1.5` to `1.6` (`leading-relaxed`).
- Anything that wraps to three or more lines needs at least `1.4` - `1.5`.

## 3. Letter-spacing by size
- Large headings: slightly negative letter-spacing (`tracking-tight` or `-0.02em`) to bind headline words visually.
- Small uppercase labels / badges: slightly positive letter-spacing (`tracking-wider` or `tracking-widest`, `+0.05em`).
- Body copy at reading sizes: normal letter-spacing (`tracking-normal`).

## 4. Cap the measure (Reading Line Length)
Long lines make it hard for the eye to find the next one. Cap long-form text around 60–75 characters per line (`max-w-prose` or `max-w-2xl`).

## 5. Wrap deliberately
- `text-wrap: balance` (`[text-wrap:balance]`): distributes text evenly across lines. Use it on headings so they don't leave lonely dangling words.
- `text-wrap: pretty` (`[text-wrap:pretty]`): stops a single short word landing on the final line (widow prevention). Use it on descriptions, subheadings, and lead paragraphs.
- `overflow-wrap: break-word` (`break-words`): where long links or names could overflow.
- `white-space: nowrap` (`whitespace-nowrap`): on badges, price tags, and small meta chips where a mid-word or mid-phrase break looks broken.

## 6. Tabular numbers
For counters, statistics, dates, financial amounts, and timers, use tabular figures (`font-variant-numeric: tabular-nums` or `tabular-nums`) so numbers don't jump around or misalign columns.
