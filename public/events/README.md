# Landmark event PNGs

Drop transparent PNG cutouts in each destination subfolder. Filenames must
match the `src` paths declared in
[`src/lib/data/landmarkEvents.js`](../../src/lib/data/landmarkEvents.js).

Layout per destination (defaults — change in the config):

| Side  | Suggested width  | Notes                                  |
|-------|------------------|----------------------------------------|
| left  | ~18 vw desktop   | Foreground hero figure, drop shadow.   |
| right | ~16 vw desktop   | Foreground secondary figure.           |
| bg    | ~50 vw desktop   | Optional softer background atmosphere. |

Image guidelines:

- Transparent PNG, ideally with soft edges (no hard cutouts).
- Vertical orientation works best (figures standing on the “stage floor”).
- Recommended max dimension ~1600 px on the long edge to keep payloads small.
- Subjects should leave breathing room around themselves so drop shadows blend.

Missing images fail silently — the `<img>` simply hides itself, so it's safe
to leave a folder empty while you're sourcing assets.
