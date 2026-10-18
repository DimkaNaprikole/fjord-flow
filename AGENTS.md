# Visual consistency

- Use `fjord-theme.css` as the shared visual system; it loads after feature CSS.
- Reuse `--ff-*` tokens for panels, cards, typography, controls and dialogs. Text buttons use a dark teal background and a light label; do not introduce cream, white or pink button variants.
- Keep scenic page backgrounds, photographs, flip-card imagery and map tiles intact. Do not replace their background images when changing text surfaces.
- When changing a background, verify computed foreground colours too. Check primary/secondary links, selected/disabled states and modal actions; inherited colours and older ID selectors can override new styling.
- Check relevant desktop and narrow layouts visually. Keep image dimensions bounded, labels readable and controls functional. Maintain a visible keyboard focus ring.

# Public catalogue data

- After changing norway-catalog.json, bua-locations.json or shopping-centres.json, rebuild with `python scripts/public_catalogue_db.py build` and run `python scripts/test_public_catalogue_db.py` before publishing.
- Public SQLite/report exports accept only those reviewed public sources. Never add visitor accounts, transcripts, private chat skills, tokens or Worker configuration to them.
