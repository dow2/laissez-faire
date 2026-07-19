# "Rooted In" — Repurposing the Giving Back Section

**Date:** 2026-07-19
**Status:** Approved (design walkthrough approved in session; this document is the binding record)
**Scope:** Content-only change to the home page's `lf-community` section instance.

## 1. Problem

The home page's "Giving Back" section lists four invented New Orleans
community organizations as partners. Unlike other filler on the site, these
read as claimed relationships with real-sounding institutions — a trust
liability, since no community outreach program exists yet.

## 2. Decision

Repurpose the section as **"Rooted In"** — an homage index to the four
traditions the brand draws from. Same emotional register as "Giving Back,"
zero false claims: it says *this is where we come from*, not *this is who we
fund*. Chosen over two alternatives: "House Rules" brand commitments
(rejected — duplicates the Story page's sticky-panel themes) and a "Drop
Index" of product stories (rejected — Home already carries product presence
in the CTA row and marquee).

## 3. What changes (and what doesn't)

**Unchanged:** `theme/sections/lf-community.liquid` (all markup, CSS,
schema), the section's position in `index.json`'s order, and the four
already-installed row images. Each row's "Visit website" line already hides
itself when the link setting is blank — no code needed for link removal.

**Changed:** only the `community` section instance's settings and block
content in `theme/templates/index.json`:

- `title`: `Rooted In`
- `body`: `We never set out to be just a clothing brand. Laissez-Faire is as much about culture as it is about craft — these are the traditions that raised us.`
- Four blocks (names, blurbs, image reassignments; all `link` values removed):

| # | `name` | `blurb` | `image` |
|---|---|---|---|
| 1 | The Black Masking Indians | A century of hand-beaded artistry — a year of nights behind every costume, masked once, then retired. | `shopify://shop_images/lf-b3r2-community-sewing.jpg` |
| 2 | The Second Line | The parade anyone can join — a brass band, an umbrella, and the whole street moving as one. | `shopify://shop_images/lf-b3-community-secondline.jpg` |
| 3 | The Brass Bands | The city's heartbeat — raised in church, played on corners, loudest at four in the morning. | `shopify://shop_images/lf-b3r2-community-bar.jpg` |
| 4 | The Night Shift | The cooks, bartenders, and musicians who keep the lights humming after everyone else goes home. Cut for them. | `shopify://shop_images/lf-b3r2-community-nightshift.jpg` |

## 4. Known accepted compromise

Row 3's corner-bar image is the loosest fit for "The Brass Bands" — it reads
as live-music culture rather than a band. Acceptable now; a dedicated
brass-band image can be generated later (~0.1 credits via the
`docs/IMAGE-PROMPTS.md` pipeline and its binding wording rules) and swapped
in the Theme Editor.

## 5. Reversibility

When real outreach exists, the section converts back to genuine partners by
editing these same four rows (name/blurb/link/image) in the Theme Editor —
nothing structural changes now or then. `docs/CONTENT-GUIDE.md`'s Community
section entry stays accurate either way (it documents the row mechanics, not
the topic).

## 6. Verification

Dev-theme render of `/`: title "Rooted In", the new body line, four rows
with the reassigned images (assert each row's `img` src filename), zero
"Visit website" links rendered, no console errors. The section's reveal
animation and hover behavior are untouched and need only a smoke glance.
