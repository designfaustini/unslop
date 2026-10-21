# unslop rules

The short form of everything the inspector measures and a juror notices. Read once, before you write
the page. Numbers come from the source study of 247 gallery sites unless marked as house style.

## House rules (measured by `check`)

| Never | Instead |
| --- | --- |
| A headline over **two lines** at any width (every h1–h6, and the first screen's main line). | Cut words, then widen the measure, size last. |
| A first screen without a clear title in the one `h1`; a section without a heading. | Say what it is: the name and what it does, the event with date and place. |
| Unequal outer margins; a section huddled in one half with the other half empty. | Close every void with its picture, a second column, a list or a figure. |
| A blank stretch taller than half a screen; two near-empty screens. | The normal section gap; one deliberate rest per page at most. |
| A statement set large over many lines. | `<p>` or `<blockquote>` at 36px or less (24px phone), about 25 words. |
| Eyebrows: small label or pill badge above a heading, "New ·" chips. | Put it in the heading or first sentence, or drop it. |
| Monospace outside real `<pre>`/`<code>`. | The text face; `.num` for aligned figures. |
| Index numbering: 01 / 02 / 03, (001), "Step 2". | Order by position, size or words; a real `<ol>` if order matters. |
| Thin rules: hairlines, 1px outlined boxes, grid lines, crop marks. | Space, a step in ground tone, a change of scale, a filled shape. |
| Gradients anywhere (backgrounds, buttons, text). | Flat colour or a real photograph; a neutral scrim under text on a photo is the one exception. |
| Shadows or glows on things at rest. | A tone step; shadows only on what floats (menu, dialog). |
| The assistant palette: cream with terracotta or rust, violet, indigo. | The dealt palette. |
| Tiny uppercase letter-spaced labels. | Sentence case at a readable size. |
| Icon-topped feature cards; rows of identical cards. | The dealt section blueprint. |
| Glass, backdrop blur, floating pill navigation. | A plain bar: wordmark, three to five links, one action. |
| Emoji, gradient blobs, decorative shapes, fake dashboards of grey bars. | A real picture, a real interface fragment, or nothing. |
| A styled accent word in a headline (italic, serif, coloured, underlined). | One face, one colour; the words carry the emphasis. |
| More than two typefaces. | The dealt type system (one family is normal). |

Left alone: real code in `<pre>`/`<code>`, real tables and form fields (they may have lines), and an
interface fragment whose root has `data-ui` (the product's own borders and menus).

Removing ornament leaves space. Never fill it with another ornament: fill it with scale, the full
content, a picture made for this subject, or a field of flat colour. Blind jurors prefer a richer page
with tells over an empty page without them; substance is half the job.

## Blueprint versus tokens

The card's parts disagree in small ways. Settle every disagreement in this order: these rules → the
direction (idea, composition, where the accent goes) → type and palette → the hero blueprint → the
section blueprints. Take geometry from blueprints (columns, proportions, what sits where); take
everything else from above. Map every size a blueprint names onto one of five steps (`--step-small`,
`--step-body`, `--step-lead`, `--step-head`, `--step-display`). One button shape, one corner radius
(`--radius`), one pair of margins on the whole page. A blueprint that names a typeface, a radius or a
border yields to the tokens.

## Words

- **Two-line arithmetic.** Characters per line ≈ line width ÷ (font size × k), k ≈ 0.40 condensed,
  0.50 most grotesks and serifs, 0.58 wide or all caps. Phone 390px at 44px holds about 16 per line,
  so about **32 characters** for two lines. Gallery heroes: median 5 words, 32 characters.
- One supporting sentence 32–48px under the headline, shown with it. When the headline is a name or a
  figure of speech, this sentence says plainly what the thing is.
- The first screen answers the visitor's first question in large type: an event's dates and place, a
  product's price or job, a person's work.
- Buttons name what they do ("Book a table", "See the plans"), never "Learn more" or "Get started".
- No stock phrases: unlock, seamless, elevate, empower, cutting-edge, next-gen, world-class, all-in-one,
  effortless, reimagine, leverage, "in today's", "the future of", "more than just". Say the specific thing.
- Few em dashes (two per page at most). Sentence case everywhere.

## Laws of the craft

**Type.** Two or three sizes do the visible work: one very large, one small. Median headline-to-body
ratio is 4.3; the best sites' largest type is about 8.4vw against 5.0vw on weak ones. Display tracking
−0.02 to −0.05em, leading 0.85–1.05. Text 16–20px, leading 1.45–1.6, 45–75 characters per line.
Left-aligned by default; centre at most one moment. Five sizes is the ceiling.

**Space.** One grid, one pair of tight margins (16–48px) everywhere; big things run to the edges. Text
blocks share two or three left edges on the whole page. Asymmetry lives inside the grid, never in the
frame. Sections are 120–240px apart on desktop, clearly more than any gap inside one. Each section has a
different composition from its neighbours.

**Colour.** One ground, one ink, one accent. The accent is on the action and perhaps one other thing.
Running text in the full ink (grey is for captions). Surfaces part by a tone step. A section may change
the whole field colour; nothing fades into anything. Check contrast on dark grounds.

**Pictures.** One dominant image beats six small ones: on the top sites the hero media covers half the
first screen or more 68% of the time. Same crop ratios, one treatment, square corners unless the
direction says otherwise. Nothing ever lies on top of a headline. At least four real pictures (SVG
does not count), usually six to twelve, plus one moving picture where an honest clip exists. Every
found picture is downloaded, credited in the footer and listed in the report; none is presented as the
client's own. Never a sentence about where the pictures come from; a caption says what the picture is.

**Components.** Buttons flat, one fill, square or fully round, decided once (top sites: 52% square,
23% pill; the 9–16px "soft" radius is the weak-site default). Navigation: wordmark, three to five plain
links, one action. The footer is a designed close, not a sitemap.

**Motion.** Transform and opacity only, with reduced-motion fallbacks (the kit has them). The inspector
fails a page with fewer than eight moving elements and warns under sixteen; the automatic entrances
usually cover it. Kit attributes: `data-reveal` (stagger, automatic on `main section > .wrap`; opt out
with `data-still`), `data-move="masked|shutter|scale-out|push|ink|window|sideways|crossfade|marquee"`,
`data-story` with `data-step`/`data-frame`, `data-index-preview` with `data-img`, `data-count`,
`data-drift`, `data-lift`, `data-parallax`, `.drag-row`, `.curtain-main` + `.curtain-foot`. Content
is never hidden without script; nothing waits for a preloader; the title is readable in 1.2s.

## Look (the critique, after each check)

Open `look-1.jpg` and `look-2.jpg` together. Judge the pictures, never the code. Ask, in order:

1. **One second, then five.** What did you see first? A single thing, or "a website"? Can a stranger
   say what this is and what to do from the first screen?
2. **Squint.** Two or three large masses with clear size differences, or many medium ones?
3. **Cover the logo.** Could this belong to a competitor? Does the idea reach pricing, FAQ, footer?
4. **Frame and space.** Equal margins, no huddled halves, no holes, section gaps larger than inner gaps.
5. **Type and colour.** A decisive jump to the headline, five sizes or fewer, accent in one or two places.
6. **Pictures and fullness.** Four or more real pictures doing a job, one light and grade; every screen
   a composed poster; every section's content complete and readable.
7. **Phone.** Its own composition and line breaks, nothing cut off, the first screen still one thing.
8. **Collisions.** Anything over a headline or button, a reveal that left a blank band, sideways overflow.

Score like an Awwwards juror, 1–10 each: design 40%, usability 30%, creativity 20%, content 10%.
Real Sites of the Day land at 7.5–8.0; if your first score is 9, score again as a juror who did not
build it. Caps: any FAIL → overall ≤ 6; a banned device visible → ≤ 6.5; fewer than four real
pictures → design ≤ 6.5; the idea passes for a competitor → creativity ≤ 7; no live thing →
creativity ≤ 7.5; a section missing or thin → content ≤ 6; no button on the first screen →
usability ≤ 7; no clear title → usability ≤ 6.

Write it in exactly four lines:

```
ROUND n · seen first: … · idea: … · live thing: …
scores: design _ · usability _ · creativity _ · content _ → overall _._ (caps: …)
worst three: 1) … 2) … 3) …
fix: … (each as a concrete edit)
```

Fix the worst three, in this order of value: anything a stranger cannot read or find → the frame
(margins, holes, title) → the idea missing from a section → pictures → type scale → details.
Stop when a round has 0 FAIL and nothing scores under 7, or after round three.
