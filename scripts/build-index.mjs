#!/usr/bin/env node
/**
 * Aggregates boards/<id>/board.json into dist/index.json in the exact shape
 * Case Maker's "Sources" feature consumes: { name, boards: [...] }.
 * Run AFTER validate.mjs (CI enforces the order).
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dirs = readdirSync('boards', { withFileTypes: true }).filter((d) => d.isDirectory());
const boards = dirs
  .map((d) => JSON.parse(readFileSync(join('boards', d.name, 'board.json'), 'utf8')))
  .map((b) => ({ schemaVersion: 1, ...b, builtin: false }))
  .sort((a, b) => a.id.localeCompare(b.id));

mkdirSync('dist', { recursive: true });
writeFileSync(
  'dist/index.json',
  JSON.stringify({ name: 'Case Maker Community', boards }, null, 2) + '\n',
);
console.log(`✓ dist/index.json — ${boards.length} board(s).`);
