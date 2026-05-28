# Museum Artifact Images

Save finished artifact PNGs in this folder using the stable keys from
`src/data/artifactLibrary.ts`.

Recommended format:

- Size: 768x432 or 1024x576
- Background: warm cream with the soft sage circle already included
- Object: centered, simple, thick dark outline, muted vintage colors
- No text

Example filenames:

- `folded-envelope.png`
- `travel-suitcase.png`
- `moon-jar.png`
- `paper-plane.png`
- `teacup.png`
- `postcard.png`
- `brass-key.png`
- `ticket-stub.png`
- `closed-book.png`
- `paint-tube.png`
- `tiny-camera.png`
- `seed-packet.png`
- `map-pin.png`
- `quiet-clock.png`
- `recipe-card.png`

After adding an image, register it in `src/data/artifactLibrary.ts`:

```ts
const artifactImageSources = {
  'folded-envelope': require('../../assets/artifacts/folded-envelope.png'),
};
```
