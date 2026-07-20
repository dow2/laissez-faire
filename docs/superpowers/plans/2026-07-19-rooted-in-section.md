# Rooted In Section Content Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose the home page's "Giving Back" community section into "Rooted In" — swap title, body, and all four block name/blurb/image values in `theme/templates/index.json`, per the approved spec at `docs/superpowers/specs/2026-07-19-rooted-in-section-design.md`.

**Architecture:** Content-only change confined to a single JSON template file. `theme/sections/lf-community.liquid` (markup, CSS, schema) is untouched — the `{% if block.settings.link != blank %}` guard already hides "Visit website" automatically once `link` is omitted, so no code changes are needed anywhere.

**Tech Stack:** Shopify Online Store 2.0 theme (Liquid + JSON templates), Shopify CLI (`shopify theme dev` / `shopify theme push`).

---

## Current state (for reference)

`theme/templates/index.json`'s `community` section instance today (verified 2026-07-19):

```json
"community": {
  "type": "lf-community",
  "blocks": {
    "partner1": { "type": "partner", "settings": {
      "name": "NOLA Second Line Society",
      "blurb": "Keeping the tradition of the second line alive for the next generation of the city's brass bands and social clubs.",
      "image": "shopify://shop_images/lf-b3-community-secondline.jpg"
    } },
    "partner2": { "type": "partner", "settings": {
      "name": "Crescent City Youth Arts",
      "blurb": "Free after-school music and craft programs for kids across the Ninth Ward and beyond.",
      "image": "shopify://shop_images/lf-b3r2-community-sewing.jpg"
    } },
    "partner3": { "type": "partner", "settings": {
      "name": "Magnolia Relief Fund",
      "blurb": "Rebuilding and repair support for New Orleans families still recovering from storm damage.",
      "image": "shopify://shop_images/lf-b3r2-community-bar.jpg"
    } },
    "partner4": { "type": "partner", "settings": {
      "name": "The Running Late Club",
      "blurb": "A community of night-shift workers, musicians, and service industry lifers who know the city after dark.",
      "image": "shopify://shop_images/lf-b3r2-community-nightshift.jpg"
    } }
  },
  "block_order": ["partner1", "partner2", "partner3", "partner4"],
  "settings": {}
}
```

Note `settings` is currently empty, so `title`/`body` fall through to the section schema's defaults ("Giving back" / the old body copy) — this task adds explicit `title` and `body` keys so the instance no longer relies on those stale defaults. None of the four blocks currently set a `link`, so the "Visit website" line is already hidden — this task keeps it that way (no `link` key is added).

---

### Task 1: Swap community section content to "Rooted In"

**Files:**
- Modify: `theme/templates/index.json` (the `sections.community` object, lines 119–162)

- [ ] **Step 1: Create the branch**

```bash
cd /Users/dow/laissez-faire
git checkout master
git pull --ff-only
git checkout -b content/rooted-in-section
```

Expected: new branch created off an up-to-date `master`.

- [ ] **Step 2: Pull any live merchant edits first (content-sync safety)**

Per `RUNBOOK.md`'s "Content sync" procedure — `templates/*.json` is a file the Shopify Theme Editor can also write to, so pull before editing to avoid silently discarding merchant changes:

```bash
shopify theme pull --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com \
  --only 'templates/*.json' --only 'config/settings_data.json'
git status --short
```

Expected: empty diff (no Theme Editor edits have been made to `index.json` since the last push). If the diff is non-empty, stop and commit that pulled content separately first (`git add theme/templates theme/config/settings_data.json && git commit -m "content: pull merchant edits from live theme"`) before continuing to Step 3.

- [ ] **Step 3: Edit the `community` section's `settings` block**

In `theme/templates/index.json`, find `"community": { "type": "lf-community", ...`. Replace the section's `"settings": {}` (the last key inside the `community` object, currently on its own line just before the closing brace) with:

```json
      "settings": {
        "title": "Rooted In",
        "body": "We never set out to be just a clothing brand. Laissez-Faire is as much about culture as it is about craft — these are the traditions that raised us."
      }
```

- [ ] **Step 4: Edit each of the four blocks' `name`, `blurb`, and `image`**

Still inside `theme/templates/index.json`, replace each block's `settings` object exactly as follows (do not change the block keys `partner1`–`partner4`, the `type: "partner"` value, or `block_order` — only the three fields inside each `settings` object):

`partner1`:
```json
        "partner1": {
          "type": "partner",
          "settings": {
            "name": "The Black Masking Indians",
            "blurb": "A century of hand-beaded artistry — a year of nights behind every costume, masked once, then retired.",
            "image": "shopify://shop_images/lf-b3r2-community-sewing.jpg"
          }
        },
```

`partner2`:
```json
        "partner2": {
          "type": "partner",
          "settings": {
            "name": "The Second Line",
            "blurb": "The parade anyone can join — a brass band, an umbrella, and the whole street moving as one.",
            "image": "shopify://shop_images/lf-b3-community-secondline.jpg"
          }
        },
```

`partner3`:
```json
        "partner3": {
          "type": "partner",
          "settings": {
            "name": "The Brass Bands",
            "blurb": "The city's heartbeat — raised in church, played on corners, loudest at four in the morning.",
            "image": "shopify://shop_images/lf-b3r2-community-bar.jpg"
          }
        },
```

`partner4`:
```json
        "partner4": {
          "type": "partner",
          "settings": {
            "name": "The Night Shift",
            "blurb": "The cooks, bartenders, and musicians who keep the lights humming after everyone else goes home. Cut for them.",
            "image": "shopify://shop_images/lf-b3r2-community-nightshift.jpg"
          }
        }
```

Note the four blocks swap image assignments relative to today's state (see "Current state" above): `partner1` picks up the sewing image (was on `partner2`), `partner2` picks up the second-line image (was on `partner1`); `partner3` and `partner4` keep their current images. Double-check the final file has each image on the row listed above, not the old row.

- [ ] **Step 5: Validate the JSON is well-formed**

```bash
python3 -m json.tool theme/templates/index.json > /dev/null && echo "valid JSON"
```

Expected: `valid JSON` printed, no exceptions.

- [ ] **Step 6: Preview on the local dev-theme proxy**

```bash
shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com --theme "161862975716"
```

Leave it running, then open `http://127.0.0.1:9292/` (this proxy bypasses the storefront password gate). Scroll to the community section and verify by eye:
- Section heading reads "Rooted In" (not "Giving back").
- Body copy reads "We never set out to be just a clothing brand. Laissez-Faire is as much about culture as it is about craft — these are the traditions that raised us."
- Four rows, in order: "The Black Masking Indians", "The Second Line", "The Brass Bands", "The Night Shift", each with a blurb and image.
- No "Visit website" link appears on any row.
- No errors in the browser console.

Stop the `shopify theme dev` process (Ctrl-C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git add theme/templates/index.json
git commit -m "content: repurpose Giving Back section as Rooted In"
```

Expected: one commit on `content/rooted-in-section` containing only the `theme/templates/index.json` diff (plus any Step 2 content-sync commit, which is separate and already made).

---

## Shipping

This is a single-task, single-file content change — no separate "final code review" pass is needed beyond Task 1's own verification. Once Task 1 is committed and verified on the dev-theme proxy, merge to `master` and push to the live theme following the same pattern used for prior phases (e.g. `v0.4.3-imagery`):

```bash
git checkout master
git merge --no-ff content/rooted-in-section -m "merge: Rooted In section content swap"
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
git push
git branch -d content/rooted-in-section
```

No version tag is warranted for a copy-only change this small (prior tags marked structural phase ships, not content edits).
