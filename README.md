# Controller Tester

Test PS5 DualSense / DualSense Edge, PS4 DualShock 4, Xbox and any other gamepad in the browser. No install, nothing uploaded.

**Live:** https://hammadxcm.github.io/playstation-controller-tester/

## What it does

Every controller, every browser (Gamepad API):

- Live controller silhouette with button, stick and trigger highlights
- Stick lab: trace, drift, circularity error, coverage, resolution bits, deadzone and fault badges (inner deadzone, center skipping, low resolution, incomplete range, axis snapping)
- Trigger lab: analog value, range, resolution
- Button lab: press counts, hold time, chatter (re-press within 20 ms) and stuck detection, raw axes
- Rumble: dual-rumble and, where supported, trigger-rumble (Xbox impulse triggers)
- Health check: six guided steps producing a 0–100 score and grade
- Report: JSON and PNG export, copy summary, for warranty or RMA tickets
- Learn mapping: teach the app the layout of pads the browser does not recognise

Pro Mode (WebHID, desktop Chrome / Edge, USB or Bluetooth):

| | DualSense / Edge | DualShock 4 |
|---|---|---|
| Raw sticks, triggers, buttons | ✓ | ✓ |
| Touchpad (two fingers) | ✓ | ✓ |
| Gyro / accelerometer, factory calibration | ✓ | ✓ |
| Battery, charging, USB / headset flags | ✓ | ✓ |
| Rumble over HID (works on Bluetooth) | ✓ | ✓ |
| Lightbar | ✓ | ✓ + flash |
| Player LEDs, mic LED | ✓ | – |
| Adaptive triggers (feedback, weapon, vibration, bow, galloping, machine) | ✓ | – |
| Firmware / hardware version | ✓ | – |

## Browser support

| | Chrome / Edge desktop | Chrome Android | Firefox | Safari |
|---|---|---|---|---|
| Gamepad API | ✓ | ✓ | ✓ (no timestamps) | ✓ (no vendor ids) |
| dual-rumble | ✓ | ✓ | partial | – |
| trigger-rumble | ✓ Win / macOS, Linux BT | – | – | – |
| Pro Mode (WebHID) | ✓ | – | – | – |

Report-rate and latency figures are what the browser observes, not what the hardware sends.

If Pro Mode finds nothing, close Steam, PS Remote Play, DS4Windows or reWASD: they take the HID reports first.

## Development

```
pnpm install
pnpm dev        # http://localhost:5173/playstation-controller-tester/
pnpm test       # vitest: parsers, encoders, CRC, analysis
pnpm typecheck && pnpm lint && pnpm build
```

Layout: `src/core` is framework-free and unit-tested (Gamepad helpers, WebHID drivers, analysis); `src/features` holds one folder per screen; `src/state` is a small zustand store. Hot-path frames never touch React state.

Protocol references: Linux `hid-playstation.c`, SDL `SDL_hidapi_ps5.c` / `SDL_hidapi_ps4.c`, Nielk1's TriggerEffectGenerator, nondebug/dualsense.
