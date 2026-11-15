# Gatekeeper sprites

`Gatekeeper.tsx` loads these five transparent PNGs via the static paths in
`GATEKEEPER_SPRITES` (`src/lib/gameConfig.ts`):

- `smug.png`
- `annoyed.png`
- `nervous.png`
- `panicking.png`
- `meltdown.png`

If a file is missing, the stage shows a "MISSING SPRITE" notice for that emotion.
