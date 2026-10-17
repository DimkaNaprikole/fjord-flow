# Visual consistency

- Use `fjord-theme.css` as the shared visual system; it loads after feature CSS.
- Reuse `--ff-*` tokens for panels, cards, typography, controls and dialogs. Text buttons use a dark teal background and a light label; do not introduce cream, white or pink button variants.
- Keep scenic page backgrounds, photographs, flip-card imagery and map tiles intact. Do not replace their background images when changing text surfaces.
- When changing a background, verify computed foreground colours too. Check primary/secondary links, selected/disabled states and modal actions; inherited colours and older ID selectors can override new styling.
- Check relevant desktop and narrow layouts visually. Keep image dimensions bounded, labels readable and controls functional. Maintain a visible keyboard focus ring.
