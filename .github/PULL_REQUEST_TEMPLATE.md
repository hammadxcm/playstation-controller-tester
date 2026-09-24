## What

<!-- One or two sentences on the change and why. Link the issue. -->

## How it was verified

- [ ] `pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build` pass
- [ ] Headless mock check for affected screens (`?mock=…`), no console errors
- [ ] Hardware: controller / connection / browser tested, HID console log attached (required for `src/core/hid` changes)

## Notes for reviewers

<!-- Anything non-obvious, follow-ups, screenshots. -->
