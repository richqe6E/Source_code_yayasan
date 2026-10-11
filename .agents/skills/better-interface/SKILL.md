---
name: better-interface
description: Combines all of the `better-*` skills from jakubkrehel/skills into a single review across accessibility, layout, writing, typography, color and UI polish.
---

# Interface review

This skill runs a cross-discipline review. It routes the interface to each `better-*` skill, collects their evidence and consolidates one ranked verdict.

Orchestration is all it owns. Accessibility rules belong to `better-accessibility`, structure to `better-layout`, copy to `better-writing`, type to `better-typography`, color to `better-colors`, visual polish and motion to `better-ui`.

## Core principles

### 1. Recon before judgment
Identify the framework, styling system, component library, design tokens, supported viewports and any preview or test command. Write every fix in the project's own idiom, so no finding arrives as a request to adopt a different stack.

### 2. Use domain skills as the sources of truth
Review in this order so foundational failures are not hidden by polish:
1. `better-accessibility`
2. `better-layout`
3. `better-writing`
4. `better-typography`
5. `better-colors`
6. `better-ui`

### 3. Evidence, not taste
The bar for reporting is evidence, not taste. A density, radius, or voice you merely disagree with is not a finding. Focus on what actively makes the user experience clunky, disjointed, inaccessible, or generic.
