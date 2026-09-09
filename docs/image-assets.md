# Site photo exports

All six active site photographs use the supplied error-diffusion exports. Oversized sources were resized with nearest-neighbor sampling, then encoded with lossless WebP (`cwebp -lossless -exact -m 6`). The format conversion was checked against the resized PNG intermediate: zero pixel differences for every image. Resizing intentionally reduces dimensions; lossless refers to the subsequent encoding.

| Image | PNG source | WebP delivered | File size |
|---|---|---|---:|
| group_photo | 4032x3024 | 2560x1920 | 145.6 KB |
| members_solering | 7952x5304 | 2560x1708 | 144.4 KB |
| president | 2702x1977 | 1200x878 | 73.8 KB |
| vicepresident | 886x642 | 886x642 | 19.6 KB |
| treasurer | 1786x1334 | 1200x896 | 71.9 KB |
| workshop_coordinator | 1938x2033 | 915x960 | 45.3 KB |

Total: 500,638 bytes (~501 KB), versus 3,594,409 bytes for the supplied PNGs and 13,752,406 bytes for the previous six JPEGs.

The large photos fit within 2560×1920; portraits fit within 1200×960. No image was upscaled. Original Downloads exports and old repository JPEGs were not overwritten. The ASCII CRT remains text; there were no corresponding photo exports for favicons or workshop-generated product thumbnails.

Asset filenames end in `-error-diffusion.webp`. The homepage and About page reference these directly, with intrinsic width/height attributes to reserve layout space. CSS keeps the exported colors and uses pixelated image rendering.
