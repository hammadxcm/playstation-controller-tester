# Contributing

Thanks for helping make controller testing better. This guide covers setup, the workflow, and what a change needs before it can merge.

## Setup

```
pnpm install
pnpm dev        # http://localhost:5173/playstation-controller-tester/
```

Node 22 and pnpm 12 are what CI uses (`packageManager` in package.json picks the exact version; `corepack enable` or `npx pnpm@12` both work). pnpm's release-age policy refuses packages published in the last 24 hours, so a brand-new release may need a day before it can be added. Chrome or Edge is needed for Pro Mode (WebHID); every other screen works in any modern browser.

## Workflow

1. Open an issue first for anything beyond a small fix, so the approach can be agreed on.
2. Branch from `main`, keep changes focused, and write commit messages in the imperative ("Add DS4 flash timing").
3. Before opening a pull request, run the full gate:
   ```
   pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build
   ```
   Coverage is enforced at 100 % lines, branches, functions and statements on the logic layers (`src/core`, `src/state`, `src/lib`, the model rig, analysis and wizard steps). New logic needs tests; React screens are verified headlessly instead (see below).
4. Fill in the pull request template, including how you verified the change.

## Verifying UI without hardware

Dev builds (`pnpm dev`) include a mock harness that is tree-shaken out of production:

```
/?mock=dualsense&pose=all
/?mock=dualsense&hid=1&lb=ff0044&leds=P3&mic=pulse
/?mock=xbox&theme=light&motion=reduce
```

`window.__ct` exposes `pose()`, `fx`, `hid`, `settle()` and `stats()`. Screenshots of every screen for every family, both themes and both motion modes should show no console errors.

## Verifying with hardware

For anything touching `src/core/hid`, test on a real controller over USB and Bluetooth and include the Pro Mode Console log (Console tab → Copy) in the pull request. The README's hardware checklist lists what to exercise.

## Code style

- TypeScript strict, no `any`, `noUncheckedIndexedAccess` on.
- Hot-path data (60–250 Hz frames, HID reports) is written to the DOM through refs and the shared frame loop, never React state.
- No new runtime dependencies without a reason in the pull request; the bundle is deliberately small.
- `motion` is the one animation dependency: spring-based pointer and scroll motion values, `AnimatePresence` exit transitions and a `reducedMotion="user"` switch that plain CSS/WAAPI cannot express without bespoke code. Import from `motion/react` and `motion/react-m` only, inside the `LazyMotion` boundary in `main.tsx`; never import `framer-motion` or the full `motion` component (it is 34 kB against ~20 kB for `m` + `domAnimation`).
- Prettier formats, oxlint lints; both run in CI.

## Adding a controller family

1. Driver under `src/core/hid/<family>/` implementing `HidController`, built on `SonyDevice` if it is a Sony pad.
2. Register it in `src/core/hid/registry.ts`.
3. Tests using `src/testing/fakeHidDevice.ts` for framing, transport detection and every output.
4. Drawing: either an artwork spec in `src/features/model/artwork/specs.ts` (with a compatible license recorded in `LICENSES.md`) or geometry in `src/features/model/geometry.ts`.

## Licensing of contributions

By contributing you agree that your contributions are licensed under the MIT License. Only add third-party assets or code whose license permits redistribution under MIT, and record them in `LICENSES.md`.
