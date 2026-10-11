---
name: better-accessibility
description: Helps your project comply with accessibility standards and best practices.
---

# Accessibility

Most accessibility is free if you use the platform. Native elements ship with keyboard support, real labels announce themselves and visible focus rings guide navigation.

## 1. Native elements first
- `<button>` for actions, `<a href>` for navigation.
- Never use `<div onclick>` without keyboard handlers, role, and tabindex.

## 2. Visible focus rings
- Use `:focus-visible` with a crisp, accessible ring (e.g. `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`).

## 3. Minimum hit area
- Aim for at least 44×44px on touch and 40×40px on desktop for interactive targets, buttons, and close icons.

## 4. Proper form labels
- Every input must have a linked `<label for="...">` or wrapping `<label>`. Placeholders are hints, not labels.
