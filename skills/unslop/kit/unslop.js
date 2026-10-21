// unslop kit · motion layer. Attribute-driven, transform and opacity only, no dependencies.
// Every move keeps the content visible without script and drops its travel under reduced motion.
//
//   data-reveal              children rise in, staggered 80ms, once, when the block enters
//                            (applied automatically to every `main section > .wrap` without data-still)
//   data-move="masked"       headline lines rise from behind their baseline on load (split on <br>)
//   data-move="shutter"      a picture opens from the left edge with clip-path, its image settling from 1.12
//   data-move="scale-out"    a giant wordmark shrinks a little as it leaves the screen
//   data-move="push"         a line of large type is pushed sideways by the scroll (12% → -12%)
//   data-move="ink"          a statement fills from 45% to full ink as it rises
//   data-move="window"       a picture held on a tall stage opens from a window to the full screen
//   data-move="sideways"     a row of pictures travels sideways while the vertical scroll holds the stage
//   data-move="crossfade"    the pictures inside crossfade every 5.5s
//   data-move="marquee"      one line travels sideways at a constant speed (content duplicated)
//   data-story               sticky story: [data-step] items scroll past, the [data-frame] with the same
//                            index shows in the pinned panel
//   data-index-preview       rows with data-img="url" show their picture in one frame on hover/focus
//   data-count="1984"        a figure rolls up to its value once, when seen
//   data-drift               slow scale drift on a picture (CSS)
//   data-lift                hover lift on a card or link (CSS)
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Reveal: stagger the direct children of each block, once.
  for (const w of $$('main section > .wrap')) if (!w.closest('[data-still]') && !w.hasAttribute('data-reveal')) w.setAttribute('data-reveal', '');
  const reveal = $$('[data-reveal]');
  reveal.forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8))));
  const show = (el) => el.classList.add('in');
  if (reduce || !('IntersectionObserver' in window)) reveal.forEach(show);
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveal.forEach((el) => io.observe(el));
    // Never leave content hidden: anything still unrevealed after 2.5s of being on the page shows anyway.
    addEventListener('load', () => setTimeout(() => reveal.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) show(el); }), 2500));
  }

  // Masked headline: split lines on <br>, each rises from behind its baseline.
  // A decorative copy (aria-hidden, e.g. the second colour of a split headline) gets its lines as generated
  // content, so neither screen readers nor the inspector read the words twice.
  for (const h of $$('[data-move="masked"]')) {
    const parts = h.innerHTML.split(/<br\s*\/?>/i);
    const copy = h.closest('[aria-hidden="true"]');
    const attr = (s) => s.replace(/<[^>]+>/g, '').trim().replace(/"/g, '&quot;');
    h.innerHTML = parts.map((p, i) => (copy ? `<span class="u-line"><span style="--i:${i}" data-t="${attr(p)}"></span></span>` : `<span class="u-line"><span style="--i:${i}">${p.trim()}</span></span>`)).join('');
    if (!reduce) requestAnimationFrame(() => h.classList.add('u-go')); else h.classList.add('u-go');
  }

  // Once-on-view moves: shutter and rolling figures.
  const once = (sel, fn) => {
    const els = $$(sel); if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) return els.forEach((el) => fn(el, true));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target, false); io.unobserve(e.target); } }), { threshold: 0.25 });
    els.forEach((el) => io.observe(el));
  };
  once('[data-move="shutter"]', (el) => el.classList.add('u-open'));
  once('[data-count]', (el, instant) => {
    const to = parseFloat(el.dataset.count); const dec = (String(el.dataset.count).split('.')[1] || '').length;
    const fmt = (v) => v.toLocaleString(document.documentElement.lang || undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (instant || !isFinite(to)) { el.textContent = fmt(to); return; }
    const t0 = performance.now(); const dur = 1400;
    const tick = (t) => { const k = clamp((t - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  // Crossfade: cycle the pictures inside.
  for (const box of $$('[data-move="crossfade"]')) {
    const imgs = [...box.children]; if (imgs.length < 2) continue;
    imgs.forEach((im, i) => im.classList.toggle('u-on', i === 0));
    if (reduce) continue;
    let k = 0; setInterval(() => { imgs[k].classList.remove('u-on'); k = (k + 1) % imgs.length; imgs[k].classList.add('u-on'); }, 5500);
  }

  // Marquee: duplicate the line once so the loop is seamless.
  for (const m of $$('[data-move="marquee"]')) {
    const inner = document.createElement('div'); inner.className = 'u-track';
    inner.innerHTML = m.innerHTML + `<span aria-hidden="true">${m.innerHTML}</span>`;
    m.innerHTML = ''; m.appendChild(inner);
  }

  // Index with preview.
  for (const list of $$('[data-index-preview]')) {
    const frame = list.querySelector('[data-preview]'); if (!frame) continue;
    const img = frame.querySelector('img') || frame.appendChild(document.createElement('img'));
    const rows = $$('[data-img]', list);
    const pick = (r) => { rows.forEach((x) => x.classList.toggle('u-dim', x !== r)); if (r.dataset.img && img.getAttribute('src') !== r.dataset.img) { img.src = r.dataset.img; img.alt = r.dataset.alt || ''; } };
    rows.forEach((r) => { r.addEventListener('pointerenter', () => pick(r)); r.addEventListener('focusin', () => pick(r)); });
    list.addEventListener('pointerleave', () => rows.forEach((x) => x.classList.remove('u-dim')));
    if (rows[0]) { img.src = img.getAttribute('src') || rows[0].dataset.img; }
  }

  if (reduce) return;

  // Scroll-linked moves share one rAF loop. p = 0 when the element's top meets the bottom of the
  // screen, 1 when its bottom leaves the top.
  const linked = [];
  const progress = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); };
  const held = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  for (const el of $$('[data-move="scale-out"]')) linked.push(() => { const r = el.getBoundingClientRect(); const k = clamp(-r.top / innerHeight); el.style.transform = `scale(${1 - 0.08 * k})`; });
  for (const el of $$('[data-move="push"]')) linked.push(() => { el.style.transform = `translate3d(${12 - 24 * progress(el)}%,0,0)`; });
  for (const el of $$('[data-move="ink"]')) { const lines = [...el.children]; linked.push(() => { const p = clamp((innerHeight * 0.9 - el.getBoundingClientRect().top) / (innerHeight * 0.6)); lines.forEach((l, i) => { l.style.opacity = 0.45 + 0.55 * clamp(p * lines.length - i); }); }); }
  for (const el of $$('[data-move="window"]')) { const pic = el.querySelector('.u-window'); if (pic) linked.push(() => { const k = held(el); const x = 27.5 * (1 - k), y = 20 * (1 - k); pic.style.clipPath = `inset(${y}% ${x}% ${y}% ${x}%)`; }); }
  for (const el of $$('[data-move="sideways"]')) {
    const track = el.querySelector('.u-row'); if (!track) continue;
    const size = () => { el.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`; };
    size(); addEventListener('resize', size);
    linked.push(() => { track.style.transform = `translate3d(${-held(el) * (track.scrollWidth - innerWidth)}px,0,0)`; });
  }
  for (const story of $$('[data-story]')) {
    const steps = $$('[data-step]', story); const frames = $$('[data-frame]', story);
    let cur = -1;
    linked.push(() => {
      let k = 0; steps.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.55) k = i; });
      if (k !== cur) { cur = k; frames.forEach((f, i) => f.classList.toggle('u-on', i === k)); steps.forEach((s, i) => s.classList.toggle('u-on', i === k)); }
    });
  }
  for (const el of $$('[data-parallax]')) linked.push(() => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom > 0) el.style.transform = `translate3d(0,${-r.top * 0.18}px,0) scale(1.08)`; });
  if (!linked.length) return;
  let ticking = false;
  const run = () => { ticking = false; for (const f of linked) f(); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', run);
  run();
})();
