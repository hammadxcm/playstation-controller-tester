# Third-party licenses

## Controller artwork

`src/features/model/artwork/dualsense.svg`, `dualsenseEdge.svg` and `dualshock4.svg` are the
controller drawings from [daidr/dualsense-tester](https://github.com/daidr/dualsense-tester),
used under the MIT License. The files are loaded as-is; colours, classes and the landing page's
lighting and tilt are applied at runtime.

`src/features/model/artwork/xbox.svg` (Xbox Wireless Controller, Series X|S layout with Elite paddles)
is original line art drawn for this project in the same stroke grammar, © the project authors, MIT
License like the rest of the code. No other artwork is bundled.

MIT License

Copyright (c) 2023 Xuezhou Dai (daidr)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Protocol references

Report layouts follow the Linux `hid-playstation` driver (GPL-2.0, not copied), SDL's
`SDL_hidapi_ps5.c` / `SDL_hidapi_ps4.c` (zlib, not copied), Nielk1's TriggerEffectGenerator (MIT, byte
tables re-implemented) and daidr/dualsense-tester (MIT, factory-info command ids re-implemented).
The Xbox Bluetooth layout (rumble report 0x03, battery byte, button layouts) follows Chromium's
`xbox_hid_controller.cc` (BSD-3), the Linux `hid-microsoft` driver (GPL-2.0) and atar-axis/xpadneo
(GPL-2.0); none of their code is copied, only the byte meanings.

## Runtime dependencies

- [motion](https://github.com/motiondivision/motion) (Motion for React), MIT License, © Motion Division
- [react](https://github.com/facebook/react), MIT License, © Meta Platforms
- [zustand](https://github.com/pmndrs/zustand), MIT License, © Paul Henschel
- [html-to-image](https://github.com/bubkoo/html-to-image), MIT License, © bubkoo
- Manrope and JetBrains Mono via @fontsource, SIL Open Font License 1.1
