## Board contribution checklist

- [ ] `boards/<id>/board.json` — directory name equals the `id` field
- [ ] `source` URL points at the drawing/CAD the dimensions came from
- [ ] `measurementMethod` set honestly:
  - `open-source-cad` — measured from vendor/community CAD (STEP / Eagle / KiCad / DXF)
  - `physical-measurement` — calipers on a real board
  - `datasheet` — read off a datasheet drawing
- [ ] Connector positions **cross-checked** against a second source or a physical board
      (datasheet drawings have historically been wrong ~half the time — measure, don't guess)
- [ ] Overhanging connectors use past-edge positions + the correct `facing`
- [ ] `npm run validate` passes locally

**What did you measure from?** (link + a sentence)

**Have you printed a case from this profile?** yes / not yet
