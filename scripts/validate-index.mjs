// Checks every entry in index.json the way OPNduck will install it: the pinned commit's archive must
// exist, its uncompressed tar must hash to `sha256`, it may hold only files and folders, and its
// plugin.json must match the entry (id, version, permissions). Run: node scripts/validate-index.mjs
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

const PERMISSIONS = ['jobs', 'files:read', 'files:write', 'network', 'exec', 'exec:any', 'settings', 'notify', 'hooks', 'tools']
const CORE_IDS = ['downloader', 'converter', 'image-upscaler', 'video-upscaler', 'frame-interpolation', 'subtitles', 'audio-ai', 'trim', 'upscaler', 'interpolation', 'trimmer']
const REPO_RE = /^https:\/\/github\.com\/([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9._-]{1,100})$/

const doc = JSON.parse(fs.readFileSync(new URL('../index.json', import.meta.url), 'utf8'))
const errors = []
const fail = (id, msg) => errors.push(`${id}: ${msg}`)
const seen = new Set()

for (const e of doc.plugins ?? []) {
  const id = String(e.id)
  if (seen.has(id)) fail(id, 'duplicate id')
  seen.add(id)
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id) || CORE_IDS.includes(id)) fail(id, 'bad or reserved id')
  const m = REPO_RE.exec(e.repo ?? '')
  if (!m) { fail(id, 'repo must be https://github.com/<owner>/<name>'); continue }
  if (!/^[0-9a-f]{40}$/.test(e.commit ?? '')) { fail(id, 'commit must be a full 40-character hash'); continue }
  if (!/^[0-9a-f]{64}$/.test(e.sha256 ?? '')) { fail(id, 'sha256 must be 64 hex characters'); continue }
  if (!Array.isArray(e.permissions) || !e.permissions.every((p) => PERMISSIONS.includes(p))) { fail(id, 'unknown permission'); continue }

  const res = await fetch(`https://codeload.github.com/${m[1]}/${m[2]}/tar.gz/${e.commit}`)
  if (!res.ok) { fail(id, `archive not found (${res.status}); is the commit pushed?`); continue }
  const tar = zlib.gunzipSync(Buffer.from(await res.arrayBuffer()))
  const got = createHash('sha256').update(tar).digest('hex')
  if (got !== e.sha256) { fail(id, `sha256 mismatch: index says ${e.sha256}, archive is ${got}`); continue }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-'))
  const file = path.join(dir, 'a.tar')
  fs.writeFileSync(file, tar)
  const listing = execFileSync('tar', ['-tvf', file], { encoding: 'utf8' }).split('\n').filter(Boolean)
  const odd = listing.filter((l) => !/^[-d]/.test(l))
  if (odd.length) { fail(id, `archive holds links or special files: ${odd[0]}`); continue }
  execFileSync('tar', ['-xf', file, '-C', dir, '--no-same-owner'])
  const top = fs.readdirSync(dir).find((n) => n !== 'a.tar')
  const root = e.subdir ? path.join(dir, top, e.subdir) : path.join(dir, top)
  let manifest
  try { manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8')) } catch { fail(id, 'plugin.json missing or not JSON'); continue }
  if (manifest.id !== id) fail(id, `plugin.json id is "${manifest.id}"`)
  if (manifest.version !== e.version) fail(id, `plugin.json version is "${manifest.version}", entry says "${e.version}"`)
  const want = [...(manifest.permissions ?? [])].sort().join(',')
  if (want !== [...e.permissions].sort().join(',')) fail(id, `plugin.json permissions are [${want}], entry says [${[...e.permissions].sort()}]`)
  if (!manifest.repo) fail(id, 'plugin.json should have a "repo" so users can inspect the code')
  if (e.verified === true && !process.env.ALLOW_VERIFIED) fail(id, '"verified": true may only be set by the maintainer (see REVIEW.md)')
  fs.rmSync(dir, { recursive: true, force: true })
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`ok: ${seen.size} plugin(s) checked`)
