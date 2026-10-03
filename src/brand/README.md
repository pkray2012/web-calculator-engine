# Brand assets

`zuvogo-logo-source.webp` is the supplied Zuvogo logo (2000 × 667) and the only
source for every file here. Nothing is redrawn or recolored; the variants are
crops and resizes of the same pixels:

| File | What it is |
| --- | --- |
| `zuvogo-logo-40.webp`, `-80`, `-120` | Full logo trimmed to its edges (with an even margin) at 40, 80 and 120 px tall, for the header and footer at 1x, 2x and 3x. |
| `zuvogo-mark-512.png` | The Z emblem alone, centered on a square, for the Organization logo in structured data. |
| `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png` | The Z emblem at icon sizes. |
| `og-image.png` | The full logo centered on a 1200 × 630 canvas, for link previews. |

`scripts/build.js` (`BRAND_FILES`) copies them into `dist/assets/brand/` with a
content hash in the file name, and `favicon.ico` also to the site root.

To regenerate after a new source logo, crop the emblem and the full logo from
the source with any image tool at the sizes above and keep the file names.
