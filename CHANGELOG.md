# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/hammadxcm/playstation-controller-tester/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hammadxcm/playstation-controller-tester/releases/tag/v1.0.0
