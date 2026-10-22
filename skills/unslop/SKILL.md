---
name: unslop
description: >-
  Fast anti-slop art direction for web pages. Builds a landing page, marketing site, portfolio,
  product page, event or restaurant page that does not look AI-made, in about a third of the time
  and tokens of a full design loop: one command deals a researched direction (from a library distilled
  from 247 award-gallery sites) and writes the tokens and motion kit, one command finds real openly
  licensed pictures as a single contact sheet, one command lints and inspects the page in a real
  browser and returns two look sheets. Use it whenever you build, design, redesign or polish a
  public-facing web page in any stack, or when someone says a page looks generic, templated,
  "cara de IA", "AI-made", sloppy, or asks for a premium, award-level, less generic site.
---

# unslop

A page made by a model looks like the average of every page it has seen: a centred headline, a small
label above it, three icon cards, a soft gradient, thin rules, a monospace caption. This skill replaces
those defaults with decisions, and does it on a budget.

**The budget is part of the method.** A full build is about 12 to 20 tool calls and two look rounds.
Every picture you open stays in context for the rest of the session, so you open a few composite
sheets, never folders of screenshots. Hold to these:

- Do not read `engine/` or `library/`: the CLI reads them for you. Read `RULES.md` once, before you write the page.
- Make independent calls in one turn (both look sheets together; several edits together).
- Write `index.html` once, complete. Fix it with targeted edits; never rewrite it, never re-read it whole (Grep for the line).
- Keep notes (inventory, argument, copy deck) in your head or your reply, not in files.
- Open only the images the CLI names: `candidates.jpg`, `look-1.jpg`, `look-2.jpg`.

`<skill>` below is this skill's folder; run from the project root (work files go to `.unslop/`).
Needs Node 22+ and Chrome, Edge or Chromium (Playwright's Chromium is found automatically).

```bash
U="node <skill>/scripts/unslop.mjs"
```

## The run

### 1. Brief, inventory, argument (no tool calls)

Find what is real: the subject, the audience, the one action the page must get, the stack, any brand
(colours, faces, logo) and **what imagery truly exists** (their photos, a real interface, an image
tool, nothing). If the request is vague, decide and state your reading in one line; ask only when a
missing fact blocks the work.

List 8 to 12 things that belong to this client and no competitor: its name and what it means, its
street and what that place looks like, its numbers (seats, minutes, year, price), its constraint (one
batch a month, by appointment), materials, rituals and hours, the printed things of its world (ticket,
label, menu). The idea comes from this list, and each place, material and printed thing on it is a
picture query.

Then write the page as claims with proof, one line per section. The claims choose the sections and
their order; a section with no claim is deleted. This is how you avoid hero, logos, three features,
testimonial, pricing, CTA.

### 2. Plan: deal the direction and the kit (2 calls)

```bash
$U plan --sector <sector> --brief "<one line>" --sections <roles in argument order> [--tone t] [--have x] [--keep palette,type]
$U plan <same arguments> --direction <id> [--site <folder of index.html>]
```

The first call prints three directions in one line each. Choose the one whose device can carry
something from your inventory, not the most familiar; say why in one line. The second prints the
**plan card** (idea engine, hero and section blueprints, type, colour, motion, picture advice) and
writes `unslop.css` (dealt tokens + neutral kit) and `unslop.js` (motion) next to the page, plus the
`<head>` lines to paste.

- Sectors: saas, dev-tool, ai-product, consumer-app, finance, agency, studio-portfolio, personal-portfolio, ecommerce, physical-product, fashion, hospitality, restaurant, real-estate, architecture, event, health, education, nonprofit, culture, music, other.
- Roles: intro, about, features, showcase, how-it-works, work, gallery, list, stats, proof, testimonial, pricing, faq, contact, cta, footer (menu, services, process, visit and similar are mapped for you). The hero is implied.
- `--have`: only assets that really exist (`photography`, `product-photo`, `product-ui`, `illustration`, `video`). Found archive pictures do not count.
- `--keep palette,type` when the brand fixes them; then map its values onto the roles in `unslop.css`.

**Adopt the card.** Unfamiliar is the point. Redraw one slot only for a reason you can state (brand
constraint, missing asset, content that cannot fit): `$U plan --redraw section:<role>` (or `hero`,
`type`, `palette`, `direction`), and list each redraw in the report. If the palette fights the
subject's own colours, keep its proportions and take the colours from the subject. `$U plan --show`
reprints the card.

### 3. The idea, the live thing, the words (no tool calls)

Fill both blanks from your inventory before building:

> On this page, **[something only this client has]** becomes **[the device the card calls for]**.

Competitor test: put the nearest real competitor in the sentence. If it still works, the idea is the
category's; pick another item from the list.

**One live thing** made from the idea: something the visitor can do, or that differs per visit (pick a
wood and see the chair in it, set the loan and read the real monthly figure, see whether the oven is lit
right now). Real content, works with a thumb, plain fallback without script, never blocks reading.
Every winning page in the source study's blind tests had one.

Then the copy deck, following RULES.md §Words: every headline two lines or fewer at every width (about
32 characters is safe), one plain supporting sentence under the h1, one primary action as a real
button on the first screen, and **every section delivering its full content** (the whole menu with
prices, each room, every speaker, the price and what it includes). Sample details where the brief is
silent are fine and listed in the report; proof (clients, quotes, reviews, logos, statistics) is never
invented.

### 4. Pictures (2 or 3 calls)

Preference: the project's own → generated, if you have an image tool → **real pictures of the
subject's world from open collections** → drawn in code (SVG, one flat language, palette colours) for
what no honest picture exists of → type and colour alone.

```bash
$U images "<inventory query>" "<query>" "<query>" "<query>" [--max 12] [--orientation landscape]
```

All queries run in parallel over Openverse, Wikimedia Commons, the Art Institute of Chicago and the Met
(licences safe for commercial use) and come back as **one numbered contact sheet**. Search the
inventory, not the category: its street in old postcards, an old map of the neighbourhood, its material
up close, its trade in engravings, a museum object of its kind. Open `.unslop/candidates.jpg` once,
then:

```bash
$U keep 2,5,7,9 --to <site>/assets/img        # full-size downloads + credits.json
$U credits --to <site>/assets/img             # the footer credit line, HTML
```

`$U images --video "<query>"` finds one honest clip for a muted loop (`keep` saves it with a poster).
A found picture shows the world around the client, never the client's own product, room, dish or team.
Software shows its own interface built in HTML (root marked `data-ui`); those fragments count as
pictures. No network: draw, pass `--allow few-pictures` to check, and say so in the report.

### 5. Build: one write

Read `RULES.md` now if you have not. Then write the whole page in one go:

1. The `<head>` lines the plan printed; page-specific CSS in one `<style>`, using the tokens only
   (`var(--bg)`, `var(--ink)`, `var(--accent)`, `var(--field-1)`, `var(--step-*)`, `var(--font-*)`).
   Set `--step-display` from the hero blueprint. Kit classes: `.wrap` (equal margins), `.grid`
   (12 columns), `.section`, `.field-1/.field-2/.field-accent/.surface`, `.display/.head/.lead/.small`,
   `.btn`, `.bar`, `.media`, `.credits`, `.num`.
2. The hero exactly as its blueprint describes, at desktop and phone. The big thing big, the small
   things small.
3. Each section from its blueprint with this project's content: keep the geometry, change the subject,
   carry the idea into every section including pricing, FAQ and footer. Neighbours never share a layout.
4. The pictures large and with intent, `width`/`height`/`alt` set, `loading="lazy"` below the fold.
5. The live thing, inside the section where it proves the claim.
6. Motion is mostly done: `unslop.js` staggers the entrance of every `main section > .wrap`, and the
   kit gives buttons and links their press and hover. Add the card's signature move with its attribute
   (the card prints the markup) and one moving picture (`data-drift` on a photo, or the clip).
7. The footer closes the page (the name at full width is common on strong sites) and carries the credits.

### 6. Check and look (2 rounds, 3 at most)

```bash
$U check <site>/index.html
```

Lint and the real-browser inspector run together (1440 and 390 px). The output lists every FAIL with
its fix, the WARNs in one line each, and names two sheets. **Open both in the same turn**:
`look-1.jpg` (first screens, desktop and phone, in detail) and `look-2.jpg` (the whole page, screen by
screen). Judge only the pictures, then write the critique in four lines (RULES.md §Look). Fix every
FAIL and the top three visible problems with targeted edits, in one turn, and check again.

Treat each WARN as wrong unless you can defend it in one sentence. Do not argue with the meter or hide
things from it. When a round shows 0 FAIL and nothing visible scores under 7, run
`$U check <site>/index.html --final` (adds 768 px) once and stop. Round three is the cap.

### 7. Report

Briefly: the direction (name, seed) and any redraws with reasons; the idea sentence and the live thing;
the last critique scores and what still falls short; every found picture or clip with title, creator,
licence and source (`$U credits`) and where the credit sits; drawings standing in for photographs;
sample content to replace before launch. Claim no check you did not run.

## Special cases

- **Existing brand:** `--keep palette,type`, map its values onto the roles. If the brand itself needs
  a banned device (a gradient logo, a violet accent), keep the asset, pass `--allow <rule>` to check,
  say so in the report.
- **Redesign or review:** `$U check <url or file>` on the page as it is first; a review stops at the
  critique and the three changes that would move it most. A redesign keeps the stack, the content,
  routes and forms; deal with `--keep` for whatever the brand fixes and rebuild section by section.
- **One component or section:** skip the plan; match the surrounding design, apply RULES.md, still check.
- **No checkout or form backend:** the action goes to the real destination, or a `mailto:` with a
  written subject and body. Never a fake payment form.
- **App screens** (dashboards, admin, settings): `node <skill>/engine/draw.mjs --app --kind <kind>`
  deals an app style and `node <skill>/engine/inspect.mjs <page> --app` checks it; the page rules
  above do not apply to the inside of an app.
