# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.3.0] - 2026-09-25

### Fixed

- DualSense over USB never finished pairing in Pro Mode ("Failed to write the report"). The USB output report is 48 bytes on the wire (id + 47), which is what the descriptor declares and what macOS reports as the device's maximum; the app was sending 63, the Linux driver's struct size with padding the descriptor never mentions. Chromium refuses any output report longer than the descriptor's maximum on every operating system, so this affected macOS, Windows and Linux alike. DualSense USB frames are now 47 bytes; Bluetooth (77), DualShock 4 (31 / 77) and Xbox (8) were already within their limits.

### Changed

- The site is now called **Deadzone**. The name replaces "Controller Tester" in the top bar, tab title, metadata, web manifest, README and release titles; the app's translations keep the brand untranslated. A gamepad mark (Iconoir, MIT) sits next to the wordmark in both top bars and replaces the old lightning-bolt favicon, following the light and dark themes. The share image is regenerated from the current landing page.

## [1.2.0] - 2026-09-24

### Added

- Xbox controllers in Pro Mode: a WebHID driver for Xbox One S, Series X|S, Elite Series 2 and the Adaptive Controller over Bluetooth (over USB they speak GIP, not HID). Fields are read from the pad's report descriptor rather than fixed offsets, so the old 10-button layout, the 5.x Linux-style layout and the Elite's duplicated fields all decode. Raw 16-bit sticks and 10-bit triggers, every button incl. Share, Elite 2 paddles and active profile, the four-level battery report with charging and power source, and rumble over HID with the impulse-trigger motors, throttled to the pad's 50 ms Bluetooth cadence. Pro Mode shows left / right trigger sliders when a pad has impulse triggers and hides the Sony-only cards.
- Xbox line art: an original top-view drawing of the Xbox Wireless Controller (Series X|S layout, LB / RB, View / Menu / Share, tinted A B X Y, dish d-pad, Elite paddles) in the same stroke style as the Sony drawings, driven by the shared rig. Sticks travel and scale, triggers fill, buttons glow, impulse rings and grip heat follow rumble, and Overview's Show values overlay works on it. Replaces the generated Xbox model on Overview, Pro Mode and the landing.
- Landing page: an Xbox section with that drawing (impulse triggers, the Xbox button, Share and the Elite paddles light on hover) and a matrix of what the Gamepad API and Pro Mode each reach, in all nine languages. Verified at phone, iPad portrait and landscape and desktop widths.
- Mock harness: `?mock=xbox&hid=1` injects a mock Xbox WebHID pad.
- Hero: an "Xbox controllers" button that scrolls to the Xbox section, and README credits for the Xbox protocol references (xpadneo, Chromium, Linux hid-microsoft, SDL, the Edge trigger-rumble explainer).

### Fixed

- Landing top bar on phones: the hamburger button now sits at the right edge instead of next to the brand (the spacer only grew inside the app shell).

### Changed

- `HidController.rumble` takes optional left and right trigger magnitudes; Sony drivers ignore them.
- Landing copy leads with "Is your controller GTA VI ready?" in all nine languages; the tab title, meta description, Open Graph and Twitter cards, JSON-LD and the web manifest carry the same hook.
- The site now lives at https://dualsense.fyniti.co.uk/ (GitHub Pages custom domain, served from the root path); the old github.io address redirects. Saved preferences are keyed by path, so they start fresh once.

## [1.1.0] - 2026-09-24

### Added

- Landing page shown until a controller connects: a PS5-style hero with the DualSense drawing running an idle demo on a pointer-tilted depth stage, an Add Device section that covers both paths in (press any button for the Gamepad API, pair over WebHID for Pro Mode) with a per-browser support table, a showcase of DualSense, DualSense Edge and DualShock 4 with hover callouts that light the real parts (adaptive triggers, paddles, Fn keys, touchpad, lightbar), and a feature-tour tile row for every screen. Crossfades into the app the moment a pad or WebHID device appears; "Home" returns to it.
- Theme follows the OS by default (`system`), with a pre-paint script so light-theme visitors never see a dark flash, and a `theme-color` meta for browser chrome.
- `#pro` and `#report` deep links open those screens directly; the current tab is mirrored into the URL hash.
- Mock harness: `mock=none` keeps the landing up with the other params, `edge=1` makes the mock WebHID pad report as a DualSense Edge.
- Nine languages (English, Spanish, Portuguese, French, German, Russian, Japanese, Chinese, Korean) for the landing page, app chrome, empty states and the connect flow, with a picker that persists and an `auto` mode that follows the browser; `<html lang>`, the title and the description follow along.
- SEO and sharing: Open Graph and Twitter cards with a preview image, canonical URL, JSON-LD `WebApplication` data, a web manifest, `robots.txt` and a sitemap.
- Accessibility: skip link, landmark `nav`/`main`, labelled language and theme controls, header cells in the support table, high-contrast and forced-colors fallbacks.
- Release engineering: a CI workflow for pull requests and branches (gate plus Prettier check, build uploaded as an artifact), a tag-driven release workflow that publishes GitHub Releases with notes taken from this changelog and the built site attached, the version shown in the app footer, and [RELEASING.md](RELEASING.md) describing branching, versioning, cutting a release and rolling back.
- `motion` (Motion for React) as the one animation dependency, loaded through `LazyMotion` with the small feature set and `reducedMotion="user"`; `?motion=reduce` reaches it too.

### Changed

- Reduced motion now also freezes the landing demo, disables pointer tilt and scroll parallax and stops the ambient background.
- Granted WebHID devices are re-opened once per page load rather than on every Pro Mode mount.
- `--font` no longer names Inter, which was never bundled; body text uses the system stack.

### Security

- Move to pnpm 12 with its minimum-release-age supply-chain policy (packages younger than 24 h are refused), TypeScript 7, and the latest major of every GitHub Action (checkout v7, setup-node v7, pnpm/action-setup v6, Pages artifact/deploy v5), all SHA-pinned; self-host fonts so visitors never contact Google; redact factory-command payloads (serial, Bluetooth address) from the HID console; ship the `?mock=` harness in dev builds only; add a Content-Security-Policy; namespace `localStorage` keys by deploy path (github.io projects share one origin); strip scripts, event handlers and external references from controller drawings before rendering.

## [1.0.0] - 2026-09-24

### Added

- Gamepad API testing for any controller: live model, stick lab (drift, circularity, resolution, deadzone, fault badges), trigger lab, button lab (chatter, stuck), rumble and trigger-rumble, six-step health check with score and JSON/PNG export, mapping learner for unrecognised pads.
- Pro Mode over WebHID for DualSense, DualSense Edge and DualShock 4 (USB and Bluetooth): raw inputs, touchpad, calibrated motion, battery, lightbar (with flash on DS4 and a rainbow effect), player LEDs with brightness, mic LED, rumble, all seven adaptive-trigger modes with engaged read-back, firmware and factory data, several controllers side by side, and a HID console logging every report.
- USB audio: controller sound-card selection, tone and file playback, haptic-channel routing, headphone/speaker path and volumes, microphone level meter.
- Accurate DualSense, Edge and DualShock 4 drawings (daidr/dualsense-tester, MIT) with a "show values" overlay; generated Xbox and generic models.
- Motion system built on CSS and the Web Animations API with full reduced-motion support; view transitions between screens.
- Headless test harness (`?mock=`) and a 100 % coverage gate on the logic layers.

### Fixed

- Bluetooth transport detection and output framing for DualSense and DualShock 4; player-LED brightness flag; first lightbar colour being overridden by the boot-glow reset; overlapping output reports during slider drags.

[Unreleased]: https://github.com/hammadxcm/playstation-controller-tester/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/hammadxcm/playstation-controller-tester/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/hammadxcm/playstation-controller-tester/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/hammadxcm/playstation-controller-tester/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/hammadxcm/playstation-controller-tester/releases/tag/v1.0.0
