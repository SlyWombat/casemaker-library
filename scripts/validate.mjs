#!/usr/bin/env node
/**
 * Validates every boards/<id>/board.json:
 *  - Zod schema (mirrors Case Maker's boardProfileSchema, community rules:
 *    source URL + measurementMethod REQUIRED, builtin must not be true)
 *  - directory name === board id, ids kebab-case and unique
 *  - geometry lint: holes inside the PCB, components on/near the PCB
 *    (≤ 25 mm overhang), sane magnitudes
 *
 * Exit code 1 with a per-file report on any failure.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const componentKind = z.enum([
  'usb-c', 'usb-a', 'usb-b', 'micro-usb', 'hdmi', 'micro-hdmi', 'barrel-jack',
  'ethernet-rj45', 'gpio-header', 'sd-card', 'flat-cable', 'fan-mount',
  'text-label', 'antenna-connector', 'custom',
]);
const facing = z.enum(['+x', '-x', '+y', '-y', '+z', '-z']);
const xyz = z.object({ x: z.number(), y: z.number(), z: z.number() });
const positiveXyz = xyz.refine((s) => s.x > 0 && s.y > 0 && s.z > 0, {
  message: 'size must be positive on all axes',
});

const edge = z.enum(['+x', '-x', '+y', '-y']);

const boardSchema = z.object({
  schemaVersion: z.number().int().positive().optional(),
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  manufacturer: z.string().min(1),
  pcb: z.object({ size: positiveXyz }),
  mountingHoles: z.array(z.object({
    id: z.string().min(1), x: z.number(), y: z.number(), diameter: z.number().positive(),
  })),
  components: z.array(z.object({
    id: z.string().min(1),
    kind: componentKind,
    position: xyz,
    size: positiveXyz,
    facing: facing.optional(),
    cutoutMargin: z.number().nonnegative().optional(),
    cutoutShape: z.enum(['rect', 'round']).optional(),
    fixtureId: z.string().min(1).optional(),
  })),
  defaultStandoffHeight: z.number().nonnegative(),
  recommendedZClearance: z.number().nonnegative(),
  retentionShoulder: z.boolean().optional(),
  retentionFootprint: z.object({
    x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive(),
  }).optional(),
  retentionClips: z.array(z.object({
    edge, offset: z.number().nonnegative(),
    width: z.number().positive().optional(),
    style: z.enum(['clip', 'shelf']).optional(),
    reach: z.number().positive().optional(),
  })).optional(),
  secondaryBoardMounts: z.array(z.object({
    id: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
    size: positiveXyz,
    standoffHeight: z.number().nonnegative(),
    overhang: z.number().positive().optional(),
    clips: z.array(z.object({
      edge, offset: z.number().nonnegative(), width: z.number().positive().optional(),
    })),
  })).optional(),
  enclosure: z.object({
    flangeThickness: z.number().positive(),
    body: z.object({
      x: z.number(), y: z.number(),
      width: z.number().positive(), height: z.number().positive(), depth: z.number().positive(),
    }),
    bossDiameter: z.number().positive(),
    bossHeight: z.number().positive(),
    edgeProtrusions: z.array(z.object({
      id: z.string().min(1), edge, from: z.number(), to: z.number(), depth: z.number().positive(),
    })).optional(),
  }).optional(),
  // Community requirements — provenance is mandatory here.
  source: z.string().url({ message: 'source must be the URL you measured from' }),
  crossReference: z.string().url().optional(),
  datasheetRevision: z.string().optional(),
  measurementMethod: z.enum(['datasheet', 'open-source-cad', 'physical-measurement']),
  visualAssets: z.object({
    glb: z.string().optional(),
    topImage: z.string().optional(),
    sideImage: z.string().optional(),
    license: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }).optional(),
  builtin: z.literal(false).optional(),
  // Curator-set after a case printed from this profile has been physically
  // verified to fit. Do NOT set it in your own PR — a maintainer flips it.
  verified: z.boolean().optional(),
});

const MAX_OVERHANG = 25; // mm a connector may stick out past the PCB edge
const MAX_DIM = 500;     // mm sanity ceiling on any dimension

function lintGeometry(b) {
  const errs = [];
  const { x: px, y: py, z: pz } = b.pcb.size;
  if (px > MAX_DIM || py > MAX_DIM || pz > 10) errs.push(`pcb.size implausible (${px}×${py}×${pz})`);
  for (const h of b.mountingHoles) {
    if (h.x < 0 || h.x > px || h.y < 0 || h.y > py) {
      errs.push(`hole ${h.id} at (${h.x},${h.y}) is outside the ${px}×${py} PCB`);
    }
    if (h.diameter > Math.min(px, py) / 2) errs.push(`hole ${h.id} diameter ${h.diameter} implausible`);
  }
  for (const c of b.components) {
    const over = Math.max(
      -c.position.x, -c.position.y,
      c.position.x + c.size.x - px, c.position.y + c.size.y - py, 0,
    );
    if (over > MAX_OVERHANG) {
      errs.push(`component ${c.id} overhangs the PCB by ${over.toFixed(1)} mm (> ${MAX_OVERHANG})`);
    }
    if (c.size.x > MAX_DIM || c.size.y > MAX_DIM || c.size.z > 100) {
      errs.push(`component ${c.id} size implausible`);
    }
  }
  return errs;
}

const boardsDir = 'boards';
const failures = [];
const ids = new Set();
const dirs = existsSync(boardsDir)
  ? readdirSync(boardsDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

if (dirs.length === 0) {
  console.error('No boards/ entries found.');
  process.exit(1);
}

for (const dir of dirs) {
  const file = join(boardsDir, dir.name, 'board.json');
  const label = `${dir.name}`;
  if (!existsSync(file)) {
    failures.push(`${label}: missing board.json`);
    continue;
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    failures.push(`${label}: not valid JSON — ${e.message}`);
    continue;
  }
  const parsed = boardSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      failures.push(`${label}: ${issue.path.join('.') || '(root)'} — ${issue.message}`);
    }
    continue;
  }
  const b = parsed.data;
  if (b.id !== dir.name) failures.push(`${label}: directory name must equal board id "${b.id}"`);
  if (ids.has(b.id)) failures.push(`${label}: duplicate board id`);
  ids.add(b.id);
  for (const err of lintGeometry(b)) failures.push(`${label}: ${err}`);
  // Warn (not fail) on unknown top-level keys — likely authored for a newer format.
  const known = new Set(Object.keys(boardSchema.shape));
  for (const key of Object.keys(raw)) {
    if (!known.has(key)) console.warn(`WARN ${label}: unrecognized field "${key}" (newer schema?)`);
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`✓ ${dirs.length} board(s) valid.`);
