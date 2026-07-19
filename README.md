# Case Maker Community Board Library

Community-contributed board profiles for [Case Maker](https://electricrv.ca/casemaker) —
the parametric 3D-printable enclosure generator. Add this library inside Case Maker via
**Sources → Add source** with the published index URL:

```
https://slywombat.github.io/casemaker-library/index.json
```

Boards you enable from this source show up in the board picker next to the built-ins,
and enclosures generate around their real connector and mounting-hole geometry.

## Contributing a board

1. Create `boards/<board-id>/board.json` (the directory name must equal the `id` field).
2. Fill in the profile — see `boards/example-40x30-breakout/board.json` for a commented
   walkthrough of every field, and the
   [technical reference](https://github.com/SlyWombat/CaseMaker) for the full format.
3. Open a PR. CI validates the schema and runs a geometry lint (components on the PCB,
   holes in bounds, sane sizes). On merge, the index republishes automatically.

### Measurement standards — the part that actually matters

A profile that *validates* can still be wrong by millimetres, and a case printed from it
goes straight in the bin. Requirements:

- **`source`** (required): URL of the mechanical drawing / CAD you measured from.
- **`measurementMethod`** (required): one of
  - `open-source-cad` — measured from vendor or community CAD (STEP/Eagle/KiCad/DXF). **Preferred.**
  - `physical-measurement` — calipers on a real board. Good.
  - `datasheet` — read off a datasheet drawing. Acceptable, but historically error-prone
    (connector positions especially) — cross-check anything you can.
- Coordinate convention: origin at the PCB's **min corner** (bottom-left, top view),
  X right, Y up, Z out of the board top. Connector `position` is the component's min
  corner; overhanging connectors (USB lips past the PCB edge) use negative/past-edge
  positions with `facing` set to the wall they exit.

### Verified tier

Boards get `"verified": true` once a maintainer (or trusted contributor) has
physically printed a case from the profile and confirmed the fit. Don't set it
in your own submission — say "printed: yes" in the PR and a maintainer flips
the flag. Case Maker shows verified boards with a ✓ badge and lists them first.

## Format

`index.json` is `{ "name": "...", "boards": [ ...board profiles... ] }` — exactly what
Case Maker's **Sources** feature consumes. Profiles carry `schemaVersion` (currently 1).

## License

Board profile data is licensed [CC BY 4.0](LICENSE). By contributing you agree to
license your submission under the same terms.
