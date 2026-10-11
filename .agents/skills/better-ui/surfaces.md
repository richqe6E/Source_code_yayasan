# Surfaces

Border radius, optical alignment, shadows and image outlines.

## Concentric border radius

When nesting rounded elements, the outer radius must equal the inner radius plus the padding between them:

```
outerRadius = innerRadius + padding
```

Past `24px` of padding, treat the layers as separate surfaces and choose each radius independently.

### Tailwind example
```html
<!-- Good: concentric radii -->
<div class="rounded-2xl p-2 bg-slate-100">       <!-- 16px radius, 8px padding -->
  <div class="rounded-lg bg-white p-4">          <!-- 8px radius = 16 - 8 -->
    ...
  </div>
</div>
```

## Optical alignment

### Buttons with text + icon
Where an icon makes symmetric padding look unbalanced, use slightly less on the icon side:
`icon-side padding = text-side padding - 2px`.

```html
<button class="ps-4 pe-3.5 flex items-center gap-2">
  <span>Lanjutkan</span>
  <i class="fi fi-rr-arrow-right text-xs"></i>
</button>
```

### Elevation and Shadows
Use soft, multi-layer shadows instead of harsh single dark shadows:
`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 6px -1px rgb(0 0 0 / 0.04), 0 10px 15px -3px rgb(0 0 0 / 0.03);`
