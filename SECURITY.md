# Security policy

## Scope

Deadzone is a static site. It runs entirely in the browser, makes no network requests of its own after loading, stores only preferences and learned button layouts in `localStorage`, and never transmits controller data anywhere. Pro Mode talks to the controller through WebHID only after the user picks the device in the browser's own chooser.

The page ships a Content-Security-Policy that allows only same-origin scripts, fonts and connections. The HID console never records factory payloads (serial number, PCBA id, Bluetooth address); fonts and every other asset are served from the site itself, so no third party sees visitors' requests.

Things we consider security-relevant:

- Any way for a page to reach a controller without the browser's device prompt
- Malformed HID reports causing the page to hang or crash
- Supply-chain issues in dependencies or the build pipeline
- Third-party assets or code included without a compatible license

## Reporting a vulnerability

Please do not open a public issue for security problems. Email hammadkhanxcm@gmail.com with a description, steps to reproduce, and the affected version or commit. You will get an acknowledgement within 7 days and a fix or mitigation plan within 30 days for confirmed issues. Credit is given in the changelog unless you prefer otherwise.

## Supported versions

Only the latest deployment on `main` (https://hammadxcm.github.io/playstation-controller-tester/) is supported.
