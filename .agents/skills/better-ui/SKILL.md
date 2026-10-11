---
name: better-ui
description: Polishes and improves the UI in your project. Covers concentric border radius, optical alignment, surface depth, contextual icons, tactile press states, and micro-interactions.
---

# UI Polish

Polish comes from a pile of small details that compound. This skill is the reference for which are worth having and what values they take.

Keep the project's component library, tokens and density, and match its motion language except where a rule below prescribes an exact interaction.

## 1. Concentric border radius
Outer radius = inner radius + padding.
Mismatched radii on nested elements is the most common thing that makes an interface feel off.
```
outerRadius = innerRadius + padding
```
Example: If a card has `padding: 8px` (`p-2`) and inner element has `border-radius: 12px` (`rounded-xl`), the card must have `border-radius: 20px` (`rounded-2xl` or `rounded-[20px]`).

## 2. Optical over geometric alignment
When geometric centering looks off, align optically:
- **Buttons with text + icon**: Use slightly less padding on the icon side: `icon-side padding = text-side padding - 2px`. (e.g. `ps-4 pe-3.5`).
- **Play button triangles**: Shift triangle glyph 1-2px rightwards (`transform: translateX(1.5px)`), because triangular center of mass is left of center.
- **Asymmetric icons**: Nudge by 0.5px - 1px to visually center.

## 3. Shadows for elevation, borders for structure
Where a border exists only to create depth, prefer layered transparent `box-shadow` values over thick dark outlines. Keep borders that communicate structure or state: dividers, input focus rings, and active states. Use subtle, translucent borders (`border-slate-200/80` or `border-white/10`).

## 4. Scale on press (Tactile Feedback)
A subtle scale-down on click gives buttons tactile feedback:
```html
<button class="transition-transform duration-150 ease-out active:scale-[0.96]">
```
Always use `scale-[0.96]` (never below 0.95, which feels exaggerated). Use CSS transitions so a release mid-press returns smoothly.

## 5. Interruptible animations
Use CSS transitions for interactive state changes (hover, active, toggle), because they can be interrupted mid-animation. Reserve keyframes for staged sequences that run once.

## 6. Subtle exit and enter transitions
Use a small fixed `translateY` (e.g., 4px to 8px) rather than massive jumps. Exits should be softer than enters. Use `ease-out` for transitions.

## 7. Image outlines
Give images a subtle 1px outline at low opacity for consistent edge definition and depth:
- Light mode: `ring-1 ring-black/5` or `border border-slate-200/60`
- Dark mode: `ring-1 ring-white/10`
