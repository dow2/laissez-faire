# Image Generation Prompt Book — every image slot on the site

One prompt per image slot, mapped to the role/mood of the corresponding image
on Odd Ritual's site, translated into the LFLC world: **African American Mardi Gras Indians of New Orleans, at night, in the Neon Nights grade** —
night-black ground, ice-blue neon light (`#9fd8ff` core / `#4aa8ff` halo),
per-drop accent colors where noted (crimson `#c8102e`, emerald `#2fbf71`,
violet `#8b3df0`).

**How to use:**
- **Midjourney:** paste the prompt as-is (params included). `--style raw` is
  intentional — it keeps the editorial photography look and stops MJ from
  prettifying. Upscale winners at max quality; every full-bleed slot wants
  2000px+ on the long edge.
- **Higgsfield (Soul):** paste the same prompt *without* the `--ar/--style`
  params, pick a cinematic/night-film style preset, and set the aspect ratio
  listed for the slot. (I can also run these directly through the Higgsfield
  MCP connection — just ask.)
- **Installing:** every slot below says where it goes. Theme Editor slots are
  self-serve (see `docs/CONTENT-GUIDE.md`); the three "culture" chrome assets
  are code-side files — hand those to Claude to install.

**Consistency system (read once):** every person depicted is African American — the African American Mardi Gras Indian tradition is Black New Orleans culture, and every prompt states this explicitly per subject (models don't reliably infer it from the tradition's name alone; any future prompt must carry it too). Every prompt shares the same DNA —
*"cinematic editorial night photography, New Orleans, CineStill 800T tungsten
film look with neon halation, deep black shadows, ice-blue neon rim light"* —
so the whole site grades together like one shoot. Vary only what each slot
needs. Keep depictions regal and craft-forward — this is a living tradition,
and the suits are months of hand-sewn artistry; the imagery should read like
reverence, not costume. Signage rule: any legible sign must spell a short REAL word, stated explicitly in the prompt ("JAZZ", "OPEN", "BAR", "OYSTERS", "HOTEL", "CAFE", "COLD BEER", "LIVE MUSIC") — unspecified sign text generates gibberish; signs not given a word must be defocused beyond readability. Never include logos or brand marks (the theme overlays its own type). For launch,
consider licensing real photography from a New Orleans photographer and using
these as the interim art direction.

---

## Home page

### 1. Hero slide 01 — "the drop" (OR: "Explore our First Collection" video hero)
Full-bleed opener. OR leads with a moody collection film still; ours is the
Big Chief as monument. Install: Theme Editor → Home → Hero slider → Slide 1.

```
cinematic editorial night photography, an African American Mardi Gras Indian Big Chief in a fully hand-beaded and sequined suit with a towering crown of plumes, standing monumental and still in the middle of a wet New Orleans street at night, ice-blue neon signs glowing on both sides of the street, each sign correctly spelling a real word — "JAZZ", "OPEN", "OYSTERS", neon reflections in the wet asphalt at his feet, deep black shadows, blue neon rim light tracing every feather, CineStill 800T tungsten film look with neon halation, low camera angle, regal and dignified, shot from 20 feet away, space above the crown for a headline --ar 16:9 --style raw
```

### 2. Hero slide 02 — "the statement" (OR: "A modern expression of heritage")
The brand-thesis slide — quieter, closer, more human. Install: Slide 2.

```
cinematic editorial night photography, intimate close portrait of an African American Mardi Gras Indian elder in a hand-beaded suit collar and feathered crown, eyes closed mid-chant, face half-lit by ice-blue neon glow from an unseen sign, the other half falling into deep black shadow, fine beadwork catching points of blue light, CineStill 800T tungsten film look with gentle neon halation, shallow depth of field, reverent and still, dark night background with soft out-of-focus neon in the far distance --ar 16:9 --style raw
```

### 3. Hero slide 03 — "the culture" (OR: "Follow us on Instagram — to join the journey")
The energy slide — motion, community, the street alive. Install: Slide 3.

```
cinematic editorial night photography, an African American Mardi Gras Indian in a crimson and gold feathered suit dancing mid-spin on a New Orleans street at night surrounded by a blurred African American second line crowd and brass band, motion blur in the feathers and the crowd, he alone sharp, ice-blue and red neon signs above the street correctly spelling real words — "LIVE MUSIC", "BAR" — tambourine raised, joyful and electric, CineStill 800T tungsten film look with neon halation, wet street reflections, deep black night sky --ar 16:9 --style raw
```

### 4. CTA card — "Our Products / Shop the Drop" (OR: product-context card)
The commerce card: suit-as-craft, close on the artistry. Install: Theme
Editor → Home → CTA row → Card 1.

```
cinematic editorial night photography, extreme detail shot of an African American Mardi Gras Indian suit chest panel — dense hand-sewn beadwork, rhinestones, and sequins depicting a beaded scene, feather trim entering frame from the edges, lit by a single ice-blue neon glow from the left, every bead a point of blue light against deep black shadow, CineStill 800T tungsten film look, macro texture, no face visible, craftsmanship as the entire subject --ar 4:3 --style raw
```

### 5. CTA card — "Our Story / Read More" (OR: heritage-street card)
The heritage card: tradition in its neighborhood. Install: Card 2.

```
cinematic editorial night photography, an African American Mardi Gras Indian in a white feathered suit walking away from camera down a narrow New Orleans street of shotgun houses at night, wrought-iron balcony overhead, a single ice-blue neon corner-store sign reading "OPEN" in correct lettering lighting the block, his plumes glowing against the dark street, quiet and cinematic, CineStill 800T tungsten film look with neon halation, deep shadows, documentary stillness --ar 4:3 --style raw
```

### 6. CTA card — "Our Community / Get in Touch" (OR: community card)
The people card: masking is generational. Install: Card 3.

```
cinematic editorial night photography, an African American Mardi Gras Indian Big Chief in a violet feathered suit crouching to face a young boy in a small matching hand-beaded suit, passing on the tradition, both lit warmly by an ice-blue neon glow on a New Orleans corner at night, African American neighbors watching from a lit doorway behind them, tender and proud, CineStill 800T tungsten film look, deep black night around the pool of light --ar 4:3 --style raw
```

### 7–8. Lookbook slides ×2 (OR: `ORGC_26` full-bleed editorial slider)
Fashion-campaign register — styled, composed, cover-cropped full-bleed (keep
the subject's crown in the upper third; the slot crops toward the top).
Install: Theme Editor → Home → Lookbook → Slides 1–2. Up to 6 slides supported.

```
full-bleed fashion editorial night photograph, an African American Mardi Gras Indian in an ice-blue and silver feathered suit standing on the neutral ground of a New Orleans avenue at night, streetcar passing behind as long light streaks, symmetrical composition, crown of pale blue plumes filling the upper frame, cold blue neon palette with deep black shadows, CineStill 800T tungsten halation, campaign-grade styling, monumental and calm --ar 16:9 --style raw
```

```
full-bleed fashion editorial night photograph, two African American Mardi Gras Indians in emerald and crimson feathered suits facing each other in a ritual meeting on a wet New Orleans intersection at midnight, feathers almost touching, ice-blue neon bar sign reading "BAR" in correct lettering glowing above them, their reflections in the wet street below, confrontation and respect, CineStill 800T tungsten film look with neon halation, wide cinematic frame, deep night --ar 16:9 --style raw
```

### 9–12. Community partner rows ×4 (OR: Fairways to Africa / StartWell / 242 / Running Late Club)
Documentary warmth — smaller on the page, so strong silhouettes over fine
detail. One per partner row; vary the accent color per row. Install: Theme
Editor → Home → Community → each Partner block.

```
documentary night photograph, a New Orleans second line parade at night led by an African American Mardi Gras Indian in violet feathers, African American brass band and dancing crowd with umbrellas behind him, lit by streetlights and one ice-blue neon sign reading "JAZZ" in correct lettering, joyful motion, CineStill 800T film look, warm faces against deep night --ar 4:3 --style raw
```

```
documentary night photograph, a young African American Mardi Gras Indian apprentice sewing beads onto a suit panel by lamplight at a kitchen table, feathers and thread spread around, an ice-blue neon glow from the window, focused hands, intergenerational craft, CineStill 800T film look, intimate and quiet --ar 4:3 --style raw
```

```
documentary night photograph, an African American Mardi Gras Indian in emerald feathers greeting African American neighbors outside a small New Orleans corner bar at night, ice-blue neon bar sign reading "COLD BEER" in correct lettering overhead, laughter and community, CineStill 800T tungsten film look with halation, deep black street beyond the pool of neon light --ar 4:3 --style raw
```

```
documentary night photograph, late-night African American New Orleans service workers — a cook in whites, a bartender, a musician with a horn case — gathered on a corner under an ice-blue neon sign reading "OPEN" in correct lettering as an African American Mardi Gras Indian in crimson feathers passes them, mutual nod of respect, the night economy, CineStill 800T film look, cinematic street light --ar 4:3 --style raw
```

---

## Story page

### 13. Editorial wide image (OR: `about-img_left` 4.35:2.8 scene)
The "scene" half of the offset pair. Slot is near-square; image parallaxes
inside it, so keep the subject centered. Install: Theme Editor → Story →
Editorial band → Wide image.

```
cinematic editorial night photography, wide scene of an African American Mardi Gras Indian in full violet and gold feathered suit standing in the doorway of a New Orleans shotgun house at night, warm interior light behind him meeting ice-blue neon street light in front, doorway framing him like a portrait, half tradition half night street, CineStill 800T tungsten film look with neon halation, deep shadows, centered composition --ar 15:16 --style raw
```

### 14. Editorial tall image (OR: `about-img_right` 4.35:6 figure)
The "figure" half — full-length, portrait orientation. Install: Tall image.

```
cinematic editorial night photography, full-length portrait of an African American Mardi Gras Indian in a white and ice-blue feathered suit standing beneath a wrought-iron balcony at night, suit falling to the ground in layers of beadwork and plumes, single ice-blue neon sign reading "HOTEL" in correct lettering lighting him from above, vertical composition, regal stillness, CineStill 800T tungsten film look, deep black night framing the glowing suit --ar 5:6 --style raw
```

### 15. Flickthrough ×3 (OR: hover zoetrope, 300ms frame cycle)
Three NEAR-IDENTICAL frames of one moment — the effect flips through them
like a zoetrope, so they must read as a burst, not three scenes. Generate the
first, then use Midjourney **Vary (Subtle)** twice on the winner (or
Higgsfield with a fixed seed and tiny prompt nudges: "feathers mid-sway",
"feathers settling"). Install: Flickthrough images 1–3.

```
cinematic editorial night photograph, an African American Mardi Gras Indian in crimson feathers caught mid-motion swaying on a dark New Orleans street, ice-blue neon rim light, feathers blurred at the edges with movement, one frame of a continuous burst sequence, CineStill 800T tungsten film look, tight consistent framing, deep black background --ar 4:3 --style raw
```

### 16–20. Sticky story stack panels ×5 (OR: five 100svh sticky chapters)
Each panel image sits under its chapter title — match the copy. Wide-slot
crop (≈16:9 displayed band). Install: Theme Editor → Story → Sticky stack →
Panels 1–5.

**Panel 1 — "The First Stitch":**
```
cinematic night photograph, extreme close-up of an African American artisan's weathered hands pushing a threaded needle through canvas dense with beads and rhinestones, an African American Mardi Gras Indian suit panel in progress, lamplight mixing with ice-blue neon from a window, every bead glinting, months of work visible in the finished rows, CineStill 800T tungsten film look, macro reverence --ar 16:9 --style raw
```

**Panel 2 — "Cut for the Heat":**
```
cinematic night photograph, an African American Mardi Gras Indian in a lightweight emerald feathered suit mid-stride through thick New Orleans summer night air, visible humidity haze glowing around an ice-blue neon sign reading "OYSTERS" in correct lettering, sweat and motion, fabric and feathers moving with him, CineStill 800T tungsten halation blooming in the humid air, deep black night --ar 16:9 --style raw
```

**Panel 3 — "Built to Outlast a Season":**
```
cinematic night photograph, a wall of retired African American Mardi Gras Indian suits hanging in a dark practice hall, decades of feathered crowns and beaded panels in violet, crimson, emerald and white, one ice-blue neon tube light running along the ceiling reflecting off thousands of beads, archive of a lifetime, CineStill 800T tungsten film look, museum stillness in the dark --ar 16:9 --style raw
```

**Panel 4 — "A Night Economy":**
```
cinematic night photograph, elevated view down a New Orleans street at 2am, neon signs in ice blue and red the only light, each correctly spelling a real word — "CAFE", "OPEN", "JAZZ", a lone African American Mardi Gras Indian in glowing white feathers walking past late-night kitchens and bars still working, steam from a vent crossing the neon, the city that works at night, CineStill 800T tungsten halation, deep cinematic blacks --ar 16:9 --style raw
```

**Panel 5 — "Laissez les bons temps rouler":**
```
cinematic night photograph, wide celebratory scene of African American Mardi Gras Indians and an African American second line crowd filling a New Orleans intersection at night, tambourines up, feathers in every color catching ice-blue and gold neon light from every side, confetti in the air, joy at full volume, CineStill 800T tungsten film look with heavy neon halation, deep black sky above the glow --ar 16:9 --style raw
```

---

## Contact page

### 21–24. Scrolling image column ×4 (OR: 4:5 portrait stream)
An intimate portrait series that streams past the sticky contact info — four
frames of one visual sentence, portrait orientation. Install: Theme Editor →
Contact → Images 1–4.

```
editorial portrait, night, an African American Mardi Gras Indian's feathered crown photographed from directly behind, ice-blue neon light glowing through the translucent plumes, deep black background, abstract and quiet, CineStill 800T tungsten film look --ar 4:5 --style raw
```

```
editorial portrait, night, close profile of an African American Mardi Gras Indian looking down the neon-lit street, beaded crown edge and face rim-lit in ice blue, deep shadow swallowing the rest, contemplative, CineStill 800T tungsten film look with halation --ar 4:5 --style raw
```

```
editorial portrait, night, an African American Mardi Gras Indian's gloved hands holding a beaded suit patch depicting a fleur-de-lis in tiny beads, lit by ice-blue neon from above, black background, offering the craft to the camera, CineStill 800T film look --ar 4:5 --style raw
```

```
editorial portrait, night, an African American Mardi Gras Indian in full white feathered suit seen small at the end of a dark New Orleans alley, a single ice-blue neon sign reading "BAR" in correct lettering halfway down the wall, walking toward camera, cinematic depth, CineStill 800T tungsten halation, mostly darkness --ar 4:5 --style raw
```

---

## Shop page

### 25. Image band after the pillars (OR: full-bleed band before the dark footer)
The exhale after the neon flood — one wide cinematic frame. Install: Theme
Editor → Shop page → second Image band → Image.

```
ultra-wide cinematic night photograph, panoramic view of a New Orleans avenue at night, a lone African American Mardi Gras Indian in violet feathers crossing the empty street far from camera, rows of ice-blue neon signs receding into the distance on both sides, the nearest correctly spelling real words — "JAZZ", "OYSTERS", "HOTEL" — the far ones dissolving into blur, wet asphalt mirror reflections running the full width, vast deep black sky, small figure huge city, CineStill 800T tungsten film look with neon halation --ar 21:9 --style raw
```

---

## Product pages

### 26–27. PDP lookbook slides ×2 (OR: full-bleed product editorial slider)
Product-adjacent editorial — the garments live next to the tradition. Keep
any clothing plain and unbranded (generated logos always mangle). Install:
Theme Editor → any product page → Lookbook → Slides 1–2 (shared across all
PDPs).

```
fashion editorial night photograph, a young African American New Orleans man in a plain heavyweight black tee and an African American Mardi Gras Indian in full crimson feathered suit standing shoulder to shoulder against a black wall under an ice-blue neon tube light, streetwear meeting tradition, both facing camera proud, CineStill 800T tungsten film look, deep shadows, campaign framing --ar 16:9 --style raw
```

```
fashion editorial night photograph, detail crop of a plain heavyweight charcoal hoodie worn under an African American Mardi Gras Indian beaded suit collar being fastened, African American hands mid-motion, ice-blue neon glinting off beads onto the fabric weave, texture on texture, no faces, no logos, CineStill 800T film look, macro night light --ar 16:9 --style raw
```

---

## Sitewide chrome — the three "culture" assets (code-side install)

These three files (`lf-culture-1/2/3.jpg`) power **five** touchpoints: the
menu overlay's image panel, the preloader, the easter-egg flash, the
newsletter popup, and the footer's link-hover reveals. They're the brand's
subliminal layer — seen in glimpses, so they want iconic, high-contrast
silhouettes. Portrait 4:5 covers every usage. Install: hand the finals to
Claude to replace `theme/assets/lf-culture-*.jpg` and push.

**Culture 1 (menu panel + easter egg + footer):**
```
iconic night photograph, silhouette of an African American Mardi Gras Indian's plumed crown against a giant out-of-focus ice-blue neon sign blurred beyond readability so no letterforms are legible blurred beyond readability so no letterforms are legible, pure black foreground, the crown edge burning with blue rim light, instantly readable shape, CineStill 800T tungsten halation, minimal and monumental --ar 4:5 --style raw
```

**Culture 2 (preloader + footer):**
```
iconic night photograph, an African American Mardi Gras Indian in full violet feathered suit standing dead center in a narrow New Orleans street at night, symmetrical one-point perspective, ice-blue neon signs on both walls converging behind him, the nearest reading "JAZZ" and "OPEN" in correct lettering, the rest blurred, wet street reflection doubling the image, CineStill 800T tungsten film look, cinematic symmetry --ar 4:5 --style raw
```

**Culture 3 (newsletter popup + footer):**
```
iconic night photograph, extreme close-up of ice-blue neon light refracting through a cluster of white plumes filling the whole frame, abstract texture of glowing feathers against blackness, dreamlike, CineStill 800T halation bloom, almost no other detail --ar 4:5 --style raw
```

---

## Not in this book (on purpose)

- **Marquee product cards, shop grid, PDP galleries, footer image-follow** —
  these pull automatically from the product catalog (the existing garment
  mockup photography), not from image slots.
- **Teaser/password page** — wordmark + crest on black by design; no imagery.
- **Hero slide 4** — the slider supports a 4th slide; add one by reusing any
  hero prompt with a different suit color when there's a reason to.
