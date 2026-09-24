# Controller Tester

[![Deploy](https://github.com/hammadxcm/playstation-controller-tester/actions/workflows/deploy.yml/badge.svg)](https://github.com/hammadxcm/playstation-controller-tester/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Coverage gate](https://img.shields.io/badge/coverage-100%25%20gated-brightgreen.svg)](CONTRIBUTING.md)
[![Live](https://img.shields.io/badge/live-github.io-2f7bff.svg)](https://hammadxcm.github.io/playstation-controller-tester/)

Test PS5 DualSense / DualSense Edge, PS4 DualShock 4, Xbox and any other gamepad in the browser. No install, no account, nothing uploaded.

**Live:** https://hammadxcm.github.io/playstation-controller-tester/

## Contents

- [What it does](#what-it-does)
- [Browser support](#browser-support)
- [Hardware test checklist](#hardware-test-checklist)
- [Privacy](#privacy)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License and credits](#license-and-credits)

## What it does

Every controller, every browser (Gamepad API):

- Live controller drawing (accurate DualSense, Edge and DualShock 4 outlines; drawn Xbox and generic models) with pressed buttons, stick travel, trigger fill, lightbar, player LEDs, mic light, touch points and a "show values" overlay
- Stick lab: glow trace, coverage ring, drift, circularity error, resolution bits, deadzone and fault badges
- Trigger lab: animated lever gauge with tick marks and max marker, resolution
- Button lab: press counts, hold time, chatter and stuck detection, raw axes
- Rumble: dual-rumble and trigger-rumble (Xbox impulse triggers) with the model shaking
- Health check: six guided steps producing a 0–100 score and grade, JSON / PNG report export
- Learn mapping for pads the browser does not recognise

Pro Mode (WebHID, desktop Chrome / Edge, USB or Bluetooth), laid out like a bench: devices on the left, the controller and its output table on the right.

| | DualSense / Edge | DualShock 4 |
|---|---|---|
| Raw sticks, triggers, buttons, Edge Fn / paddles / profile | ✓ | ✓ (no Edge fields) |
| Touchpad (two fingers, on the drawing) | ✓ | ✓ |
| Gyro / accelerometer, factory calibration, 3D cube | ✓ | ✓ |
| Battery, charging, USB / headset flags | ✓ | ✓ |
| Rumble over HID (works on Bluetooth) | ✓ | ✓ |
| Lightbar, rainbow effect | ✓ | ✓ + flash |
| Player LEDs + brightness, mic LED | ✓ | – |
| Adaptive triggers (feedback, weapon, vibration, bow, galloping, machine) with engaged read-back | ✓ | – |
| Firmware / hardware version | ✓ | – |
| Factory data (serial, PCBA id, MCU id, BT address, battery voltage, touchpad firmware) | ✓ | – |
| Speaker / headphone tone and file playback, haptic channels, mic level meter (USB only) | ✓ | – |
| Several controllers at once, side-by-side compare | ✓ | ✓ |
| HID console: every report sent / received with bytes and errors | ✓ | ✓ |

## Browser support

| | Chrome / Edge desktop | Chrome Android | Firefox | Safari |
|---|---|---|---|---|
| Gamepad API | ✓ | ✓ | ✓ (no timestamps) | ✓ (no vendor ids) |
| dual-rumble | ✓ | ✓ | partial | – |
| trigger-rumble | ✓ Win / macOS, Linux BT | – | – | – |
| Pro Mode (WebHID) | ✓ | – | – | – |
| Controller audio | ✓ (USB) | – | – | – |

Report-rate and latency figures are what the browser observes, not what the hardware sends. If Pro Mode finds nothing, close Steam, PS Remote Play, DS4Windows or reWASD: they take the HID reports first.

## Hardware test checklist

Open Pro Mode, add the controller, then for each item check the drawing reacts and the HID console shows no errors:

1. Lightbar colour, off, rainbow (DS4: flash on/off)
2. Player LEDs P1–P5 and brightness, mic LED off / on / pulse
3. Rumble strong / weak / both; the model shakes and the grips glow
4. Adaptive triggers: every mode on L2 and R2, "effect engaged" badge, release
5. Touchpad: two fingers appear on the drawing with ids and coordinates
6. Motion: cube follows tilt; gyro values are calibrated
7. Battery and charging state match the OS; Factory tab reads serial and firmware
8. Audio (USB): find the sound card, 440 Hz tone, file playback, haptic channels, mic meter

Anything that fails: Console tab → Copy, and paste the log into an issue.

## Privacy

Everything runs in your browser. The page makes no requests after loading, has no analytics, and stores only your preferences and learned button layouts in `localStorage`. Pro Mode can only reach a controller you pick in the browser's device chooser, and controller data never leaves the page. Audio tests ask for microphone permission solely so device names become visible; the stream is released immediately.

## Development

```
pnpm install
pnpm dev                # http://localhost:5173/playstation-controller-tester/
pnpm test               # vitest
pnpm test:coverage      # 100 % lines / branches / functions / statements enforced on the logic layers
pnpm typecheck && pnpm lint && pnpm build
```

Headless UI checks use a mock harness that never ships in the bundle:

```
/?mock=dualsense&pose=all                       # families: dualsense dualshock4 xbox generic; poses: idle press-south sticks-diag triggers-half dpad-up all
/?mock=dualsense&anim=1                         # time-driven sweep
/?mock=dualsense&hid=1&lb=ff0044&leds=P3&mic=pulse&trig=left:weapon   # Pro Mode with a mock controller
/?mock=dualsense&hid=2                          # two mock controllers (DualSense + DualShock 4)
/?mock=xbox&theme=light&motion=reduce           # theme and reduced-motion overrides
```

`window.__ct` exposes `pose()`, `fx`, `hid`, `settle()` and `stats()` for scripted screenshots.

Layout: `src/core` is framework-free (Gamepad helpers, WebHID drivers with a fake device for tests, factory command protocol, USB audio graph, analysis); `src/features` holds one folder per screen; `src/features/model` is the rig that animates any drawing; `src/state` is a small zustand store. Hot-path frames never touch React state.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the test gate and how to verify changes with and without hardware, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations. Hardware problems have their own issue template that asks for the Pro Mode console log. Changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License and credits

This project is released under the [MIT License](LICENSE).

Controller drawings come from [daidr/dualsense-tester](https://github.com/daidr/dualsense-tester) (MIT, © Xuezhou Dai); third-party notices are in [LICENSES.md](LICENSES.md). Protocol references: Linux `hid-playstation`, SDL `SDL_hidapi_ps5/ps4`, Nielk1's TriggerEffectGenerator, nondebug/dualsense. "PlayStation", "DualSense", "DualShock" and "Xbox" are trademarks of their respective owners; this project is not affiliated with or endorsed by Sony Interactive Entertainment or Microsoft.
