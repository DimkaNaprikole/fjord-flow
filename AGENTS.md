# Visual consistency

- Use `fjord-theme.css` as the shared visual system; it loads after feature CSS.
- Align top-level content sections with the shared `--ff-page-gutter`, `--ff-content-max` and `--ff-panel-inset` rails; avoid separate percentage side margins for new sections.
- Reuse `--ff-*` tokens for panels, cards, typography, controls and dialogs. Text buttons use a dark teal background and a light label; do not introduce cream, white or pink button variants.
- Owner exception, 22 October 2026: Both navigation rows, Home/End and news toolbar controls use light frosted surfaces, dark labels, fine nearly straight borders and restrained bevel/glow. The owner rejected filled green rounded pills for these controls; this overrides the text-button default above.
- Keep scenic page backgrounds, photographs, flip-card imagery and map tiles intact. Do not replace their background images when changing text surfaces.
- Keep the approved Ukraine/Norway composition as a full-width header background behind branding and navigation; do not turn it into standalone image cards. Preserve the complete “Wake Up Ukraine” framing.
- When changing a background, verify computed foreground colours too. Check primary/secondary links, selected/disabled states and modal actions; inherited colours and older ID selectors can override new styling.
- Check relevant desktop and narrow layouts visually. Keep image dimensions bounded, labels readable and controls functional. Maintain a visible keyboard focus ring.

# Public catalogue data

- Owner workflow: keep the existing HTML/CSS/JS website and ordinary catalogue/photo administration. Make requested design changes directly in code, using visible browser screenshots and before/after comparison with the owner. Do not reintroduce the custom visual constructor or migrate to another builder without a new request.

- After changing norway-catalog.json, bua-locations.json or shopping-centres.json, rebuild with `python scripts/public_catalogue_db.py build` and run `python scripts/test_public_catalogue_db.py` before publishing.
- Public SQLite/report exports accept only those reviewed public sources. Never add visitor accounts, transcripts, private chat skills, tokens or Worker configuration to them.

## Approved place information windows — 19 October 2026

- Use `information-dialogs.css` / `information-dialogs.js` for the light Hadeland-style reading surface across place, café, cabin, attraction, story and shopping dialogs. Keep photos, essential facts and official/directions actions visible; fold credits, reviews, long shop lists, maps and route planning separately. Preserve existing nodes/handlers and open ancestor details before a shortcut scrolls to its target. Card overlays keep their separate full-photo/gold-link style.
