#!/usr/bin/env node
// unslop: the fast run of an art-directed page. One command per step, compact output, two pictures per look.
//
//   node unslop.mjs plan --sector <s> --brief "<one line>" --sections a,b,c [--tone t] [--have x,y] [--keep palette,type]
//                                                  deal 3 directions (one line each)
//   node unslop.mjs plan <same> --direction <id> [--site DIR]
//                                                  deal the full direction as a compact card, write unslop.css + unslop.js
//   node unslop.mjs plan --show | --redraw hero|type|palette|section:<role>[=<id>]|direction [--site DIR]
//   node unslop.mjs images "<query>" ["<query>" ...] [--max 12] [--orientation landscape|portrait|square]
//                                                  search the open collections in parallel, one numbered contact sheet
//   node unslop.mjs images --video "<query>"       real footage, compact list
//   node unslop.mjs keep 1,4,7 [--to assets/img]   download the chosen candidates (or refs) at full size, with credits
//   node unslop.mjs credits [--to assets/img]      the footer credit line (HTML)
//   node unslop.mjs check [index.html] [--final] [--allow rule,rule] [--widths 1440,390]
//                                                  lint + real-browser inspect, compact findings, two look sheets
//
// Zero dependencies. Node 22+ and a Chrome, Edge or Chromium for images and check.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, statSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve, relative, extname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = join(HERE, '..', 'engine');
const KIT = join(HERE, '..', 'kit');
const WORK = resolve('.unslop');

// Behind an HTTPS proxy, Node's fetch only honours it with NODE_USE_ENV_PROXY: re-run once with it set.
const proxied = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxied && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' } });
  process.exit(r.status ?? 1);
}
process.env.TASTE_SKILL_HISTORY ||= join(homedir(), '.unslop', 'history.json');
process.env.NODE_NO_WARNINGS = '1';
if (!process.env.CHROME_PATH) {
  // Playwright's bundled Chromium is a fine browser when no system one is installed.
  for (const base of ['/opt/pw-browsers', join(homedir(), '.cache', 'ms-playwright'), join(homedir(), 'Library', 'Caches', 'ms-playwright')]) {
    try {
      for (const d of readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
        for (const exe of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) {
          if (!process.env.CHROME_PATH && existsSync(join(base, d, exe))) process.env.CHROME_PATH = join(base, d, exe);
        }
      }
    } catch {}
  }
}

const argv = process.argv.slice(2);
const cmd = argv.shift();
const opt = (name, def) => { const i = argv.indexOf('--' + name); if (i === -1) return def; const v = argv[i + 1]; argv.splice(i, v === undefined || v.startsWith('--') ? 1 : 2); return v === undefined || v.startsWith('--') ? true : v; };
const short = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const firstSentences = (s, n = 1) => String(s || '').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).slice(0, n).join(' ').trim();
const engine = (script, args, extra = {}) => spawnSync(process.execPath, [join(ENGINE, script), ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...extra });
const engineAsync = (script, args) => new Promise((res) => {
  const p = spawn(process.execPath, [join(ENGINE, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
  p.on('close', (code) => res({ code, out, err }));
});
const die = (msg, code = 2) => { console.error(msg); process.exit(code); };
const readJson = (p, def) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return def; } };
const state = () => readJson(join(WORK, 'state.json'), {});
const saveState = (s) => { mkdirSync(WORK, { recursive: true }); writeFileSync(join(WORK, 'state.json'), JSON.stringify({ ...state(), ...s }, null, 1)); };
// The engine's messages point at the long-form references; here they all live in RULES.md and in this CLI.
const retarget = (s) => String(s)
  .replace(/\(?SKILL\.md(,)? steps? [\d–-]+( and \d+)?\)?/g, '(RULES.md)')
  .replace(/references\/[\w-]+\.md( §\d+)?(, "[^"]+")?/g, 'RULES.md')
  .replace(/scripts\/assets\.mjs( --video)?/g, (m, v) => (v ? 'unslop images --video' : 'unslop images'))
  .replace(/\(RULES\.md\) \(RULES\.md\)/g, '(RULES.md)');

// ── plan ────────────────────────────────────────────────────────────────────────────────────────────
const MOTION = {
  'masked-headline': 'data-move="masked" on the h1 (lines split on <br>).',
  'shutter-image': 'data-move="shutter" on the one hero or showcase picture\'s wrapper.',
  'scaling-wordmark': 'data-move="scale-out" on the giant name.',
  'pinned-story': '<section data-story><div class="grid"><div class="u-pin">…<figure data-frame>…</figure>(one per step, stacked)</div><div><article data-step>…</article>…</div></div></section>',
  'index-preview': '<div data-index-preview><figure data-preview><img alt=""></figure><a data-img="assets/img/x.jpg" data-alt="…">row</a>…</div>',
  'curtain-footer': 'wrap everything above the footer in <div class="curtain-main">, give the footer class="curtain-foot".',
  'slow-crossfade': '<div data-move="crossfade" class="media"><img …><img …><img …></div> (give it a height or aspect-ratio).',
  'edge-marquee': '<div data-move="marquee" class="display"><span>one line</span></div> between two sections.',
  'drag-row': '<div class="drag-row">…items…</div> (native scroll-snap).',
  'colour-on-scroll': 'give each chapter its own ground: class="field-1" / "field-2" / "field-accent" / "surface" on the sections.',
  stillness: 'no showpiece; the automatic entrances and hover feedback are the whole layer.',
  'opening-window': '<section data-move="window"><div class="u-stage"><div class="u-window"><img …></div><h2 …>…</h2></div></section>',
  'ink-fill': 'data-move="ink" on a statement whose lines are child <span style="display:block">.',
  'sheet-over': 'the picture section gets style="position:sticky;top:0;height:100svh"; the next section is position:relative with its own background.',
  'sideways-gallery': '<section data-move="sideways"><div class="u-stage"><div class="u-row"><figure>…</figure>…</div></div></section>',
  'pushed-line': 'data-move="push" on one line of very large type.',
  'rolling-figures': 'data-count="1984" on each figure (its text is the fallback).',
  'carried-picture': 'single page: use data-move="shutter" on the hero picture instead.',
};
const ROLE_ALIAS = { menu: 'list', services: 'features', team: 'about', process: 'how-it-works', testimonials: 'testimonial', quote: 'testimonial', press: 'proof', numbers: 'stats', plans: 'pricing', questions: 'faq', visit: 'contact', booking: 'contact', portfolio: 'work', projects: 'work', story: 'intro' };

function fontStack(cls, family) {
  const fb = /serif|slab/.test(cls) ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  return family ? `"${family}", ${fb}` : fb;
}
function displaySettings(s) {
  const w = String(s || '').match(/\b([1-9]00)\b/)?.[1] || '600';
  const tr = String(s || '').match(/tracking\s*(-?[\d.]+em)/)?.[1] || '-0.03em';
  const ld = String(s || '').match(/leading\s*([\d.]+)/)?.[1] || '0.95';
  return { w, tr, ld };
}
function tokensCss(d) {
  const p = d.palette, t = d.type;
  const L = [':root {'];
  if (p) {
    L.push(`  --bg: ${p.bg}; --surface: ${p.surface}; --ink: ${p.ink}; --muted: ${p.muted};`);
    L.push(`  --accent: ${p.accent}; --accent-ink: ${p.accentInk || p.ink};`);
    (p.fields || []).forEach((f, i) => L.push(`  --field-${i + 1}: ${f.bg}; --field-${i + 1}-ink: ${f.ink};`));
    if ((p.fields || []).length < 2) L.push(`  --field-2: var(--surface); --field-2-ink: var(--ink);`);
    if (!(p.fields || []).length) L.push(`  --field-1: var(--ink); --field-1-ink: var(--bg);`);
  } else {
    L.push('  /* --keep palette: map the brand\'s colours onto these roles */');
    L.push('  --bg: #ffffff; --surface: #f2f2f0; --ink: #111111; --muted: #5c5c5c; --accent: #111111; --accent-ink: #ffffff;');
    L.push('  --field-1: #111111; --field-1-ink: #ffffff; --field-2: #f2f2f0; --field-2-ink: #111111;');
  }
  if (t) {
    const ds = displaySettings(t.display?.settings);
    L.push(`  --font-display: ${fontStack(t.class, t.display?.family)};`);
    L.push(`  --font-text: ${fontStack(t.class, t.text?.family || t.display?.family)};`);
    L.push(`  --display-weight: ${ds.w}; --display-tracking: ${ds.tr}; --display-leading: ${ds.ld};`);
    for (const [k, v] of Object.entries(t.scale || {})) L.push(`  --${k}: ${v};`);
  } else {
    L.push('  /* --keep type: map the brand\'s faces onto these roles */');
    L.push('  --font-display: system-ui, sans-serif; --font-text: system-ui, sans-serif;');
    L.push('  --step-small: 0.875rem; --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem); --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem); --step-head: clamp(2rem, 1.3rem + 3.2vw, 4rem);');
  }
  L.push('  --step-display: clamp(3rem, 1rem + 7.4vw, 9rem); /* set it from the hero blueprint */');
  L.push('}');
  return L.join('\n');
}
function headSnippet(d) {
  const links = [...new Set([...(d.type?.links || [])])];
  const fonts = links.length ? ['<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', ...links.map((l) => `<link href="${l}" rel="stylesheet">`)] : [];
  return [...fonts, '<link rel="stylesheet" href="unslop.css">', '<script>document.documentElement.classList.add(\'js\')</script>', '<script src="unslop.js" defer></script>'].join('\n');
}
function writeKit(d, site) {
  mkdirSync(site, { recursive: true });
  const css = `/* tokens dealt by unslop plan · ${d.direction?.name || ''} · ${d.palette?.name || 'brand palette'} · ${d.type?.name || 'brand type'} */\n${tokensCss(d)}\n\n${readFileSync(join(KIT, 'unslop.css'), 'utf8')}`;
  writeFileSync(join(site, 'unslop.css'), css);
  copyFileSync(join(KIT, 'unslop.js'), join(site, 'unslop.js'));
}
function card(d, sheetText) {
  const P = [];
  const dir = d.direction;
  P.push(`UNSLOP PLAN · ${dir.name} (${dir.id}) · seed ${d.seed} · sector ${d.input.sector}`);
  P.push(`Brief: ${d.input.brief}`);
  P.push('');
  P.push(`ENGINE: ${firstSentences(dir.idea, 3)}`);
  P.push(`COMPOSITION: ${dir.composition}`);
  P.push(`GOES WRONG: ${dir.pitfalls}`);
  P.push(`IDEA (write it before building): "On this page, [a thing only this client has] becomes [this direction's device]." Then one live thing the visitor can do, built from it.`);
  if (d.hero) {
    P.push('');
    P.push(`HERO · ${d.hero.name}: ${d.hero.blueprint}`);
    if (d.hero.mobile) P.push(`  phone: ${d.hero.mobile}`);
    if (d.hero.headline) P.push(`  headline: ${d.hero.headline}`);
  }
  if (d.sections?.length) {
    P.push('');
    P.push('SECTIONS, in order (take the geometry; type, colour, radius and button come from the tokens):');
    d.sections.forEach((s, i) => {
      P.push(`${i + 1}. ${s.role} · ${s.name}: ${s.blueprint}`);
      if (s.mobile) P.push(`   phone: ${s.mobile}`);
    });
  }
  P.push('');
  if (d.type) {
    const ds = displaySettings(d.type.display?.settings);
    P.push(`TYPE · ${d.type.display?.family}${d.type.text?.family && d.type.text.family !== d.type.display?.family ? ` + ${d.type.text.family}` : ''}: display ${ds.w}, tracking ${ds.tr}, leading ${ds.ld}. ${firstSentences(d.type.note)} ${firstSentences(dir.typography)}`);
  } else P.push('TYPE · kept from the brand: put its faces in --font-display / --font-text.');
  if (d.palette) {
    const f = (d.palette.fields || []).map((x, i) => `field-${i + 1} ${x.bg}/${x.ink}`).join(', ');
    P.push(`COLOUR · ${d.palette.name}: ground ${d.palette.bg}, ink ${d.palette.ink}, accent ${d.palette.accent} (the action and one detail, nowhere else)${f ? `, ${f}` : ''}. ${d.palette.note} Check it against the subject's own colours; if they clash, keep the proportions and take the colours from the subject.`);
  } else P.push('COLOUR · kept from the brand: map it onto the roles in unslop.css.');
  if (d.motion) P.push(`MOTION · ${d.motion.name} (the one loud move): ${MOTION[d.motion.id] || firstSentences(d.motion.description)} Entrances, hover and press are automatic (unslop.js).`);
  const q = sheetText.match(/Start with `[^`]*?"([^"]+)"`, then "([^"]+)" and "([^"]+)"/);
  P.push(`PICTURES · ${firstSentences(dir.imagery, 2)} Search the inventory, not the category${q ? `, e.g. unslop images "${q[1]}" "${q[2]}" "${q[3]}" plus your inventory's street, materials and printed things` : ''}. Four real pictures minimum, six to twelve normal; SVG drawings do not count.`);
  return P.join('\n');
}
function plan() {
  mkdirSync(WORK, { recursive: true });
  const site = resolve(String(opt('site', state().site || '.')));
  if (argv.includes('--show') || argv.includes('--redraw')) {
    const pass = [...argv, '--out', WORK];
    const r = engine('draw.mjs', pass);
    if (r.status) die(retarget(r.stderr || r.stdout));
    const d = readJson(join(WORK, 'direction.json'));
    if (!d) die('No plan yet. Run unslop plan --sector … --brief … first.');
    writeKit(d, site); saveState({ site });
    console.log(retarget(card(d, r.stdout)));
    console.log(`\nWROTE ${relative('.', join(site, 'unslop.css')) || 'unslop.css'} (tokens + kit) and unslop.js.`);
    return;
  }
  const sec = argv.indexOf('--sections');
  if (sec !== -1 && argv[sec + 1]) argv[sec + 1] = argv[sec + 1].split(',').map((s) => ROLE_ALIAS[s.trim()] || s.trim()).join(',');
  const chosen = argv.includes('--direction');
  if (!chosen) {
    const r = engine('draw.mjs', [...argv, '--options', '3', '--out', WORK]);
    if (r.status) die(retarget(r.stderr || r.stdout));
    const blocks = r.stdout.split(/^## /m).slice(1);
    console.log('Three directions for this brief. Choose the one whose device can carry something only this client has (not the most familiar), then re-run with --direction <id>.\n');
    for (const b of blocks) {
      const id = b.match(/^`([^`]+)`/)?.[1]; const name = b.match(/— (.+)/)?.[1];
      const eng = b.match(/Idea engine: (.+)/)?.[1]; const comp = b.match(/Composition: (.+)/)?.[1];
      console.log(`${id} · ${name}\n  ${short(eng, 260)}\n  first screen: ${short(firstSentences(comp), 220)}\n`);
    }
    return;
  }
  const r = engine('draw.mjs', [...argv, '--out', WORK]);
  if (r.status) die(retarget(r.stderr || r.stdout));
  const d = readJson(join(WORK, 'direction.json'));
  writeKit(d, site); saveState({ site, round: 0 });
  console.log(retarget(card(d, r.stdout)));
  console.log(`\nWROTE ${relative('.', join(site, 'unslop.css')) || 'unslop.css'} (dealt tokens + neutral kit) and ${relative('.', join(site, 'unslop.js')) || 'unslop.js'} (motion). Put this in <head>, page-specific CSS in your own <style>:\n${headSnippet(d)}`);
  console.log('\nRedraw a slot only for a stated reason (brand constraint, missing asset, content that does not fit): unslop plan --redraw section:<role>.');
}

// ── a tiny static server + browser, for contact sheets ──────────────────────────────────────────────
async function withBrowser(fn) {
  const { Browser } = await import(join(ENGINE, 'lib', 'cdp.mjs'));
  const browser = await Browser.launch();
  try { return await fn(browser); } finally { await browser.close(); }
}
async function serve(root) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
  const server = createServer((req, res) => {
    try {
      const f = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
      if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
      res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream', 'content-length': statSync(f).size });
      createReadStream(f).pipe(res);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: (p) => `http://127.0.0.1:${server.address().port}/${relative(root, p).split(sep).map(encodeURIComponent).join('/')}`, close: () => server.close() };
}
// Renders an HTML page (written into .unslop) and photographs it at the given width.
async function photograph(html, out, width) {
  const page = join(WORK, '_sheet.html');
  writeFileSync(page, html);
  const srv = await serve(WORK);
  try {
    await withBrowser(async (b) => {
      const p = await b.newPage({ width, height: 200 });
      await p.goto(srv.url(page), { settleMs: 300 });
      await p.eval(`Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })))`);
      await p.screenshot({ path: out, fullPage: true, quality: 74 });
    });
  } finally { srv.close(); }
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SHEET_CSS = 'body{margin:0;background:#1b1b1b;color:#eee;font:13px/1.3 system-ui,sans-serif;padding:12px}h2{font-size:13px;font-weight:600;margin:4px 0 8px}img{display:block;width:100%;height:auto;background:#333}';

// ── images ──────────────────────────────────────────────────────────────────────────────────────────
async function images() {
  const video = argv.includes('--video'); if (video) argv.splice(argv.indexOf('--video'), 1);
  const max = Number(opt('max', 12));
  const orientation = opt('orientation', null);
  const source = opt('source', null);
  const queries = argv.filter((a) => !a.startsWith('--'));
  if (!queries.length) die('usage: unslop images "<query>" ["<query>" ...] [--max 12] [--orientation landscape] | --video "<query>"');
  const base = ['--json', '--limit', video ? '3' : '2', ...(orientation ? ['--orientation', orientation] : []), ...(source ? ['--source', source] : [])];
  if (!video) base.push('--width', '640', '--no-check');
  const runs = await Promise.all(queries.map((q) => engineAsync('assets.mjs', [q, ...base, ...(video ? ['--video'] : [])])));
  const seen = new Set(); const perQuery = []; const unreachable = new Set();
  runs.forEach((r, qi) => {
    const j = (() => { try { return JSON.parse(r.out); } catch { return null; } })();
    const items = [];
    for (const s of j?.sources || []) { if (s.error) unreachable.add(s.name); for (const it of s.items || []) if (!seen.has(it.ref)) { seen.add(it.ref); items.push({ ...it, query: queries[qi] }); } }
    perQuery.push(items);
  });
  // interleave queries so every query is represented before any gets a second pick
  const picks = [];
  for (let k = 0; picks.length < max && perQuery.some((l) => l.length > k); k++) for (const l of perQuery) if (l[k] && picks.length < max) picks.push(l[k]);
  if (!picks.length) {
    console.log(`No pictures found${unreachable.size ? ` (could not reach: ${[...unreachable].join(', ')})` : ''}. Try the subject's place, its material, a medium ("postcard", "engraving", "old map") or a decade. With no network at all, draw what you need in one flat SVG language and say so in the report.`);
    return;
  }
  mkdirSync(join(WORK, 'cand'), { recursive: true });
  if (video) {
    writeFileSync(join(WORK, 'candidates.json'), JSON.stringify(picks, null, 1));
    picks.forEach((it, i) => console.log(`#${i + 1} ${it.ref} · ${short(it.title, 70)} · ${it.license} · ${it.duration ? Math.round(it.duration) + 's' : ''} ${it.width || ''}×${it.height || ''}${it.bytes ? ` · ${(it.bytes / 1048576).toFixed(1)} MB` : ''}`));
    console.log('\nKeep one with: unslop keep <n> (saves the clip and its poster frame). Use it as <video muted loop playsinline autoplay poster="…">.');
    return;
  }
  // download the small renditions for one contact sheet
  const ok = [];
  await Promise.all(picks.map(async (it, i) => {
    const url = it.image || it.smaller || it.original; if (!url) return;
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'unslop/1.0 (+https://github.com/designfaustini/unslop)' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) return;
      const type = res.headers.get('content-type') || '';
      if (!/^image\/(jpeg|png|webp|gif|avif)/.test(type)) return;
      const file = join(WORK, 'cand', `${String(i + 1).padStart(2, '0')}.${type.split('/')[1].replace('jpeg', 'jpg')}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      ok.push({ ...it, n: i + 1, file });
    } catch {}
  }));
  ok.sort((a, b) => a.n - b.n);
  writeFileSync(join(WORK, 'candidates.json'), JSON.stringify(ok, null, 1));
  if (!ok.length) return console.log('Found results but could not download any preview. Try again or other queries.');
  const cells = ok.map((it) => `<figure style="margin:0;position:relative"><img src="${esc(relative(WORK, it.file))}" style="aspect-ratio:3/2;object-fit:cover"><b style="position:absolute;top:6px;left:6px;background:#ff0;color:#000;padding:2px 7px;font-size:20px">${it.n}</b><figcaption style="margin-top:4px;height:2.6em;overflow:hidden">${esc(short(it.title, 60))} · ${esc(it.license)}</figcaption></figure>`).join('');
  const out = join(WORK, 'candidates.jpg');
  await photograph(`<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}</style><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${cells}</div>`, out, 1400);
  for (const it of ok) console.log(`#${it.n} ${short(it.title, 64)} · ${short(it.creator, 28) || 'unknown'} · ${it.license} · ${it.width || '?'}×${it.height || '?'} · q:${short(it.query, 24)}`);
  if (unreachable.size) console.log(`(could not reach: ${[...unreachable].join(', ')})`);
  console.log(`\nLOOK: ${relative('.', out)} (one sheet, numbered). Then: unslop keep 2,5,7 [--to assets/img]`);
}

// ── keep / credits ──────────────────────────────────────────────────────────────────────────────────
function keep() {
  const to = String(opt('to', 'assets/img'));
  const pick = String(argv.find((a) => !a.startsWith('--')) || '');
  if (!pick) die('usage: unslop keep 2,5,7 [--to assets/img]   (numbers from the last contact sheet, or refs like commons:123)');
  const cands = readJson(join(WORK, 'candidates.json'), []);
  const refs = pick.split(',').map((x) => x.trim()).filter(Boolean).map((x) => (/^\d+$/.test(x) ? (cands.find((c) => c.n === Number(x)) || cands[Number(x) - 1])?.ref : x)).filter(Boolean);
  if (!refs.length) die('Nothing to keep: no such numbers in .unslop/candidates.json.');
  const r = engine('assets.mjs', ['--get', refs.join(','), '--to', to, '--width', '1920'], { env: process.env });
  if (r.stderr.trim()) console.error(short(r.stderr, 1200));
  const credits = readJson(join(to, 'credits.json'), []);
  for (const c of credits.filter((c) => refs.includes(c.ref))) console.log(`${c.file} · ${c.width || c.imageWidth || '?'}×${c.height || c.imageHeight || '?'} · "${short(c.title, 60)}" · ${c.license}${c.poster ? ` · poster ${c.poster}` : ''}`);
  console.log(`\nCredits recorded in ${to}/credits.json. Footer line: unslop credits --to ${to}`);
}
function credits() {
  const to = String(opt('to', 'assets/img'));
  const r = engine('assets.mjs', ['--credits', '--to', to]);
  const html = (r.stdout.match(/<p[\s\S]*?<\/p>/) || [r.stdout.trim()])[0];
  console.log(html);
}

// ── check ───────────────────────────────────────────────────────────────────────────────────────────
async function check() {
  const final = argv.includes('--final'); if (final) argv.splice(argv.indexOf('--final'), 1);
  const allow = opt('allow', null);
  const widths = String(opt('widths', final ? '1440,768,390' : '1440,390'));
  const target = argv.find((a) => !a.startsWith('--')) || join(state().site || '.', 'index.html');
  if (!/^https?:/.test(target) && !existsSync(target)) die(`No such page: ${target}`);
  const round = (state().round || 0) + 1; saveState({ round });
  const out = join(WORK, 'inspect');
  const lintTarget = /^https?:/.test(target) ? null : dirname(resolve(target));
  const [lint, insp] = await Promise.all([
    lintTarget ? engineAsync('lint.mjs', [lintTarget, '--json']) : Promise.resolve({ out: '{"findings":[]}' }),
    engineAsync('inspect.mjs', [target, '--out', out, '--widths', widths, ...(allow ? ['--allow', allow] : [])]),
  ]);
  const report = readJson(join(out, 'report.json'));
  if (!report) die(`The inspector did not run:\n${short(insp.err || insp.out, 1500)}`);
  const L = [];
  const v0 = report.viewports[0]; const m = v0?.metrics || {};
  const hero = m.hero || {};
  const fams = (m.type?.families || []).slice(0, 2).map((f) => `${f.family} ${Math.round(f.share * 100)}%`).join(', ');
  L.push(`UNSLOP CHECK · ${target} · round ${round}${final ? ' · final' : ''} · widths ${widths}`);
  L.push(`measured: h1 "${short(hero.text, 40)}" ${hero.lines ?? '?'} line(s) ${Math.round(hero.size || 0)}px · faces ${fams || '?'} · ${m.page?.screens ?? '?'} screens · ${m.page?.words ?? '?'} words · ${m.page?.realPictures ?? 0} pictures${m.page?.videoCount ? ` + ${m.page.videoCount} video` : ''} · ${v0?.motion?.elements ?? 0} moving elements`);
  const lj = (() => { try { return JSON.parse(lint.out); } catch { return { findings: [] }; } })();
  const lf = lj.findings || [];
  const lgroups = new Map(); for (const f of lf) { const k = `${f.level} ${f.id}`; if (!lgroups.has(k)) lgroups.set(k, []); lgroups.get(k).push(f); }
  for (const [k, list] of lgroups) L.push(`LINT ${k.split(' ')[0]} [${list[0].id}] ${list[0].message} ${list.slice(0, 3).map((f) => `${f.file}:${f.line}`).join(', ')}${list.length > 3 ? ` +${list.length - 3}` : ''}`);
  const fails = report.findings.filter((f) => f.level === 'FAIL'); const warns = report.findings.filter((f) => f.level === 'WARN');
  const at = (f) => `@${[f.width, ...(f.alsoAt || [])].join(',')}`;
  for (const f of fails) L.push(`FAIL [${f.id}] ${at(f)} ${retarget(f.message)}\n     → ${retarget(f.fix)}`);
  for (const f of warns) L.push(`WARN [${f.id}] ${at(f)} ${short(retarget(f.message), 220)}`);

  // two look sheets instead of a dozen screenshots: the first screens in detail, then the whole scroll
  const vps = report.images || [];
  const desk = vps.find((v) => v.viewport === 'desktop'); const tab = vps.find((v) => v.viewport === 'tablet'); const mob = vps.find((v) => v.viewport === 'mobile');
  const rel = (p) => relative(WORK, p);
  const folds = [desk, tab, mob].filter(Boolean);
  const look1 = join(WORK, 'look-1.jpg'); const look2 = join(WORK, 'look-2.jpg');
  const foldCols = folds.map((v) => (v.viewport === 'desktop' ? '1100fr' : v.viewport === 'tablet' ? '330fr' : '318fr')).join(' ');
  await photograph(`<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}</style><div style="display:grid;grid-template-columns:${foldCols};gap:12px;align-items:start">${folds.map((v) => `<div><h2>${v.viewport} ${v.width}px · first screen</h2><img src="${esc(rel(v.fold))}"></div>`).join('')}</div>`, look1, folds.length > 2 ? 1700 : 1460);
  // inspect's own sheets: 4 desktop screens or 8 phone screens each; three desktop or two phone sheets per row
  const strip = (v, cols) => v ? `<h2>${v.viewport} ${v.width}px · whole page, screen by screen, left to right</h2><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin-bottom:14px">${v.pages.map((p) => `<img src="${esc(rel(p))}">`).join('')}</div>` : '';
  await photograph(`<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}</style>${strip(desk, (desk?.pages.length || 1) > 2 ? 3 : 2)}${strip(mob, 2)}`, look2, 1500);
  L.push('');
  L.push(`LOOK (judge only these pictures): ${relative('.', look1)} (first screens) · ${relative('.', look2)} (whole page)${tab ? ' · tablet in look-1' : ''}`);
  const lintFails = lf.filter((f) => f.level === 'FAIL').length;
  const nf = fails.length + lintFails;
  L.push(`RESULT: ${nf} FAIL, ${warns.length + lf.length - lintFails} WARN · round ${round}`);
  if (nf) L.push('NEXT: fix every FAIL and the worst thing you see, with targeted edits (never rewrite the file), then check again.');
  else if (!final) L.push('NEXT: write the 4-line critique (RULES.md §Look). If a visible problem scores below 7, fix the top three and check again; otherwise run check --final once.');
  else L.push('NEXT: 0 FAIL on every width. Write the report.');
  if (round >= 3 && !final) L.push('Round 3: this is the last fix round. Ship what is right; list what still falls short in the report.');
  console.log(L.join('\n'));
  process.exit(nf ? 1 : 0);
}

const COMMANDS = { plan, images, keep, credits, check };
if (!COMMANDS[cmd]) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(cmd ? 2 : 0);
}
await COMMANDS[cmd]();
