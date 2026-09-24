# Contributing

Thanks for helping make controller testing better. This guide covers setup, the workflow, and what a change needs before it can merge.

## Setup

```
pnpm install
pnpm dev        # http://localhost:5173/
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
4. Fill in the pull request template, including how you verified the change. CI runs the same gate plus a Prettier check on the pull request and attaches the built site as an artifact.

Releases are cut by maintainers from `main` by tag; see [RELEASING.md](RELEASING.md).

## Verifying UI without hardware

Dev builds (`pnpm dev`) include a mock harness that is tree-shaken out of production:

```
/?mock=dualsense&pose=all
/?mock=dualsense&hid=1&lb=ff0044&leds=P3&mic=pulse
/?mock=xbox&theme=light&motion=reduce
/?mock=none&theme=dark            # landing page
/?mock=dualsense&hid=1&edge=1     # DualSense Edge mock
/?mock=xbox&hid=1#pro             # Pro Mode with a mock Xbox pad (Bluetooth, impulse triggers)
```

`window.__ct` exposes `pose()`, `fx`, `hid`, `settle()` and `stats()`. Screenshots of every screen for every family, both themes and both motion modes should show no console errors.

Drive these checks with Playwright (the Playwright MCP tools or a script; `.playwright-mcp/` output is ignored). The Xbox work was verified this way and the same checks apply to any family:

- Landing at 1280×800 and 390×844: the section renders, `document.documentElement.scrollWidth` equals `innerWidth`, no console errors.
- Hover and keyboard focus on a showcase card set `data-hot="true"` and flip `data-on="true"` on the parts named in the card (Xbox: `l2`, `r2`, `home` and the `touchpad` slot that draws Share); leaving resets them.
- Every language via `window.__ct.store.getState().setSettings({ lang })`: same heading, callout, fact and table-row counts, no raw `a.b.c` keys.
- Pro Mode with the mock (`?mock=<family>&hid=1#pro`): the family badge, transport badge and battery show, Sony-only cards are absent for Xbox, and clicking the rumble buttons lands in `window.__ct.hid.out.rumble` with the expected `[strong, weak, left, right]`, then `[0, 0, 0, 0]` after the duration.

## Verifying with hardware

For anything touching `src/core/hid`, test on a real controller over USB and Bluetooth (Xbox: Bluetooth only, USB is GIP) and include the Pro Mode Console log (Console tab → Copy) in the pull request. The README's hardware checklist lists what to exercise. The Xbox driver reads its field layout from the report descriptor, so a wrong button on new firmware is a table edit in `src/core/hid/xbox/input.ts`; paste the Console's `open:` line (layout and report ids) and the raw report from _Show raw report_ with the issue.

## Code style

- TypeScript strict, no `any`, `noUncheckedIndexedAccess` on.
- Hot-path data (60–250 Hz frames, HID reports) is written to the DOM through refs and the shared frame loop, never React state.
- No new runtime dependencies without a reason in the pull request; the bundle is deliberately small.
- `motion` is the one animation dependency: spring-based pointer and scroll motion values, `AnimatePresence` exit transitions and a `reducedMotion="user"` switch that plain CSS/WAAPI cannot express without bespoke code. Import from `motion/react` and `motion/react-m` only, inside the `LazyMotion` boundary in `main.tsx`; never import `framer-motion` or the full `motion` component (it is 34 kB against ~20 kB for `m` + `domAnimation`).
- Prettier formats, oxlint lints; both run in CI.

## README screenshots

`docs/*.png` are 1280×800 (phones: 390×844) captures of the dev server with the mock harness (`?mock=none`, `?mock=dualsense&anim=1`, `?mock=dualsense&hid=1&…`, `?mock=xbox&anim=1`, `?mock=xbox&hid=1#pro`). Retake them after visual changes so the README matches the app.

## Adding a language

Copy `src/i18n/en.ts` to `src/i18n/<code>.ts`, translate the values (keep the `{placeholders}`), register it in `src/i18n/dicts.ts` and add the code to `LANGS` plus its native name in `LANG_NAMES` in `src/i18n/index.ts`. A test checks every dictionary has exactly the English key set. Only the landing, app chrome and connect flow are translated; the tool screens stay English.

## Adding a controller family

1. Driver under `src/core/hid/<family>/` implementing `HidController`: built on `SonyDevice` for a Sony pad, or standalone like `src/core/hid/xbox/device.ts` (which reads fields from the report descriptor through `xbox/descriptor.ts`). Methods the pad lacks return `noop` and are switched off in `caps`.
2. Register it in `src/core/hid/registry.ts`.
3. Tests using `src/testing/fakeHidDevice.ts` for framing, transport detection and every output.
4. Drawing: either an artwork spec in `src/features/model/artwork/specs.ts` (with a compatible license recorded in `LICENSES.md`) or geometry in `src/features/model/geometry.ts`.

## Licensing of contributions

By contributing you agree that your contributions are licensed under the MIT License. Only add third-party assets or code whose license permits redistribution under MIT, and record them in `LICENSES.md`.
