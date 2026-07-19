# Contribute a board with Claude Code (agent playbook)

> **Human:** point Claude Code (or any coding agent) at this file and say
> *"follow this to add my board"*:
>
> ```
> claude "Fetch https://raw.githubusercontent.com/SlyWombat/casemaker-library/main/AGENT.md and follow it to help me contribute my board"
> ```
>
> **Agent:** you are helping the user author a Case Maker board profile,
> test it in the real app, and open a PR back to this repository. Follow the
> steps in order. The cardinal rule sits in step 3 — **never invent a
> dimension**.

## 1 — Set up the environment

Check and (with the user's consent) install what's missing:

- `git`, **Node.js ≥ 18**, and the **`gh` CLI** authenticated to the user's
  GitHub account (`gh auth status`; run `gh auth login` interactively if not —
  the user must do this step themselves).
- Fork and clone this repo, then install and prove the toolchain works:

```bash
gh repo fork SlyWombat/casemaker-library --clone
cd casemaker-library
npm install
npm run validate        # should end with "✓ N board(s) valid."
```

If `gh` is unavailable, plain `git clone https://github.com/SlyWombat/casemaker-library`
works for authoring; the user can fork/PR via the GitHub web UI at the end.

## 2 — Interview the user about the board

Collect, and write down as you go:

| Fact | Notes |
|---|---|
| Board name + manufacturer | as printed/marketed |
| PCB size X × Y × Z (mm) | Z is bare PCB thickness, usually 1.6 |
| **Dimension source** | vendor CAD / Eagle / KiCad / DXF **strongly preferred**; calipers second; datasheet drawing last resort |
| Mounting holes | position of each hole **center** + diameter |
| Connectors & tall parts | kind, position, size, which edge they exit |
| Anything overhanging | USB lips, antennas past the PCB edge |

**Coordinate convention** (top view): origin at the PCB's **min corner**
(bottom-left), X right, Y up, Z out of the board top. Component `position` is
the component's min corner; a connector overhanging an edge uses a
negative / past-edge position and `facing` set to the wall it exits
(`-y` = front/bottom edge, `+x` = right edge, `+z`/`-z` = top/underside).

## 3 — Measure, don't guess (cardinal rule)

- Ask the user for the mechanical drawing / CAD URL. If they have a STEP,
  Eagle `.brd` (XML — grep it for coordinates), KiCad, or DXF file, derive
  positions from THAT, not from eyeballing a datasheet PDF. Datasheet
  drawings have historically produced wrong connector positions about half
  the time.
- If the user only has the physical board, walk them through caliper
  measurements — edge-to-connector-center for each connector, hole
  center-to-edge distances.
- Cross-check at least the connector positions against a second source or a
  photo. If you cannot verify a dimension, ASK the user to measure it —
  do not fill in a plausible value.

## 4 — Author the profile

Create `boards/<board-id>/board.json` — directory name must equal the `id`
field, id is kebab-case. Use
[`boards/example-40x30-breakout/board.json`](boards/example-40x30-breakout/board.json)
as the walkthrough. Required extras for community boards:

- `"source"`: the URL you measured from (required)
- `"measurementMethod"`: `"open-source-cad"` | `"physical-measurement"` | `"datasheet"` — set it honestly
- Do **not** set `"verified"` — a maintainer flips that after a confirmed print.

Component `kind` values: `usb-c`, `usb-a`, `usb-b`, `micro-usb`, `hdmi`,
`micro-hdmi`, `barrel-jack`, `ethernet-rj45`, `gpio-header`, `sd-card`,
`flat-cable`, `fan-mount`, `antenna-connector`, `text-label`, `custom`.

Then:

```bash
npm run validate
```

Fix every reported problem. Warnings about unknown fields usually mean a typo.

## 5 — Test it in the real app

1. Open **https://electricrv.ca/casemaker** in a browser.
2. Click **Import board JSON** and select your `board.json`.
3. Check the card's top-view preview against a photo of the real board —
   holes in the corners you expect? connectors on the right edges?
4. Select the board → **Generate shell** → inspect the 3D case: every
   connector should have a wall cutout on its side, and the status-bar bbox
   should equal `pcb + 2×(wall+clearance)` (default 4 mm per side).
5. Best of all: export the STL and print it. If the user prints and the board
   fits, say so in the PR — that's the path to the `verified` badge.

Optionally add a matching quickstart template (`template.json` support is
tracked upstream; for now note desired case settings in the PR description).

## 6 — Publish back

```bash
git checkout -b add-<board-id>
git add boards/<board-id>/
git commit -m "Add <board name>"
git push -u origin add-<board-id>
gh pr create --repo SlyWombat/casemaker-library --fill
```

Fill the PR template truthfully — especially *what did you measure from* and
*have you printed a case*. CI runs the same `npm run validate`; a maintainer
reviews provenance before merge. Once merged, the published index updates
automatically and the board appears for everyone who has the community source
enabled in Case Maker.

## Agent guardrails

- Never fabricate or "reasonably estimate" a dimension the user didn't
  provide or you didn't extract from a cited source.
- Keep the user's `source` URL in the profile even if it's imperfect —
  provenance beats polish.
- One board per PR. Don't touch other boards' files.
- If validation and the user's measurements conflict, trust the measurement
  and ask before bending either.
