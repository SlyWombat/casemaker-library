# Case Maker Community Board Library

Community-contributed board profiles for [Case Maker](https://electricrv.ca/casemaker) —
the parametric 3D-printable enclosure generator
([app source repo](https://github.com/SlyWombat/CaseMaker)). Add this library inside Case Maker via
**Sources → Add source** with the published index URL:

```
https://slywombat.github.io/casemaker-library/index.json
```

Boards you enable from this source show up in the board picker next to the built-ins,
and enclosures generate around their real connector and mounting-hole geometry.

## Contributing a board

**Easiest path — let an AI agent drive:** point Claude Code at
[`AGENT.md`](AGENT.md) and it will set up the toolchain, interview you about
your board, author and validate the profile, help you test it in the live
app, and open the PR:

```
claude "Fetch https://raw.githubusercontent.com/SlyWombat/casemaker-library/main/AGENT.md and follow it to help me contribute my board"
```

**Manual path:**

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

### Wanted boards

Looking for a first contribution? Check the
[wanted-boards issue](https://github.com/SlyWombat/casemaker-library/issues)
and anything labeled `good-first-board`.

### Verified tier

Boards get `"verified": true` once a maintainer (or trusted contributor) has
physically printed a case from the profile and confirmed the fit. Don't set it
in your own submission — say "printed: yes" in the PR and a maintainer flips
the flag. Case Maker shows verified boards with a ✓ badge and lists them first.

## Format

`index.json` is `{ "name": "...", "boards": [ ...board profiles... ] }` — exactly what
Case Maker's **Sources** feature consumes. Profiles carry `schemaVersion` (currently 1).

## Gallery

Printed a case from one of these profiles? Add a photo to your board's
directory (`boards/<id>/photos/`) and link it here in a PR — real prints are
the best proof the profiles work, and the path to the `verified` badge.

| Board | Photo |
|---|---|
| *(your print here)* | |

## Maintainers & verification policy

- PRs are reviewed for **provenance first**: where did the dimensions come
  from, and can a reviewer cross-check them?
- The `verified` flag is flipped only by a maintainer after a physical print
  from the profile is confirmed to fit (photos in the PR help).
- Questions → [Discussions on the main repo](https://github.com/SlyWombat/CaseMaker/discussions).

## No fit guarantee

Profiles here are measured by volunteers. **There is no guarantee a case
generated from any profile — verified or not — will print correctly or fit
your board.** Printer calibration, filament, and board revisions all matter;
treat your first print as a test article. `verified` means at least one
maintainer-confirmed fit, nothing more.

## License

Board profile data is licensed [CC BY 4.0](LICENSE). By contributing you agree to
license your submission under the same terms.
