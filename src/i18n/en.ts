/** Source-of-truth dictionary. Every other language mirrors this shape (checked by a test). */
export const en = {
  app: {
    title: 'Controller Tester',
    description:
      'Test PS5 DualSense, PS4 DualShock 4, Xbox and any gamepad in your browser: buttons, stick drift, circularity, rumble, adaptive triggers, lightbar, touchpad, gyro.',
  },
  nav: {
    proMode: 'Pro Mode',
    report: 'Report',
    home: 'Home',
    theme: 'Toggle theme',
    language: 'Language',
    auto: 'Auto',
    activePad: 'Active controller',
    skip: 'Skip to content',
    menu: 'Menu',
  },
  hero: {
    eyebrow: 'Free · in-browser · nothing uploaded',
    title: 'Every button, stick and trigger. Tested in seconds.',
    lead: 'Drift, dead zones, circularity, polling rate, rumble and adaptive triggers for DualSense, DualSense Edge, DualShock 4, Xbox and any gamepad. No install, no account.',
    add: 'Add a device',
    pro: 'Open Pro Mode',
    art: 'DualSense controller, demo',
  },
  add: {
    title: 'Add a device',
    step1: 'Press any button',
    step1Body:
      'Plug in over USB or pair over Bluetooth, then press any button. Browsers only reveal a gamepad after its first input. Works with DualSense, DualShock 4, Xbox and generic pads.',
    listening: 'Listening for a controller…',
    noGamepad: '{engine} has no Gamepad API. Try Chrome, Edge, Firefox or Safari.',
    step2: 'Pair for Pro Mode',
    step2Body:
      'WebHID talks to the controller directly: adaptive triggers, lightbar, player LEDs, mic LED, touchpad, gyro, battery and firmware. DualSense, DualSense Edge and DualShock 4.',
    pair: 'Pair over USB or Bluetooth',
    pairing: 'Waiting for the picker…',
    noWebHid: 'Not available in {engine}. Pro Mode needs Chrome or Edge on desktop.',
    thisBrowser: 'this browser',
    table: {
      feature: 'Feature',
      buttons: 'Buttons, sticks, triggers',
      rumble: 'Rumble',
      triggerRumble: 'Trigger rumble (Xbox)',
      pro: 'Pro Mode (PS4/PS5 via WebHID)',
      partial: 'partial',
      winmac: 'Win/mac',
      desktop: 'desktop',
    },
  },
  showcase: {
    title: 'Built for PlayStation controllers',
    lead: 'Accurate drawings of each pad light up as you press. Hover a card to see what Pro Mode can reach.',
    dualsense: {
      name: 'DualSense',
      tagline: 'PS5 wireless controller',
      callouts: ['Adaptive triggers', 'Touchpad + lightbar', 'Mic mute'],
      facts: [
        'Adaptive trigger effects',
        'Lightbar + player LEDs',
        'Haptic rumble',
        'Gyro, accel, battery',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'PS5 pro controller',
      callouts: ['Back paddles', 'Fn keys', 'Stick modules'],
      facts: [
        'Everything DualSense does',
        'Back paddles + Fn keys',
        'Trigger stops',
        'Swappable stick modules',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'PS4 wireless controller',
      callouts: ['Lightbar', 'Touchpad', 'Share / Options'],
      facts: [
        'Lightbar colour + flash',
        'Touchpad, gyro, accel',
        'Rumble',
        'USB, Bluetooth or dongle',
      ],
    },
  },
  tour: {
    title: 'Everything the app can test',
    noPad: 'No pad needed',
    sticks: {
      title: 'Sticks',
      blurb: 'Drift, dead zone, circularity and resolution with a live trace.',
    },
    triggers: { title: 'Triggers', blurb: 'Travel curves, latency and adaptive-trigger effects.' },
    buttons: { title: 'Buttons', blurb: 'Every input with chatter and stuck-button detection.' },
    haptics: { title: 'Rumble', blurb: 'Dual-rumble and trigger-rumble patterns, on demand.' },
    wizard: { title: 'Health check', blurb: 'Six guided steps to a 0–100 score you can export.' },
    pro: { title: 'Pro Mode', blurb: 'WebHID: lightbar, LEDs, mic, touchpad, gyro, battery.' },
    learn: { title: 'Learn mapping', blurb: 'Teach the app a pad without a standard layout.' },
    report: { title: 'Report', blurb: 'Your last health check as a shareable image.' },
  },
  tabs: {
    overview: 'Overview',
    sticks: 'Sticks',
    triggers: 'Triggers',
    buttons: 'Buttons',
    haptics: 'Rumble',
    wizard: 'Health check',
    pro: 'Pro Mode',
    learn: 'Learn mapping',
    report: 'Report',
  },
  shell: {
    emptyTitle: 'Connect a controller and press any button',
    emptyBody:
      'USB or Bluetooth. Browsers only reveal a gamepad after its first input. Pro Mode works without this step in Chrome and Edge.',
    footer:
      'Everything runs in your browser; nothing is uploaded. Report-rate and latency figures are what the browser observes, not what the hardware sends.',
    standard: 'standard',
    unmapped: 'unmapped',
    pro: 'Pro',
  },
  footer: {
    privacy: 'Everything runs in your browser; nothing is uploaded.',
    github: 'GitHub',
    licences: 'Licences',
  },
  pro: {
    title: 'Pro Mode (WebHID)',
    body: "Talk to the controller directly for what the Gamepad API can't reach: adaptive triggers, lightbar, player LEDs, mic LED, touchpad, gyro and accelerometer, battery, firmware and factory data. DualSense, DualSense Edge and DualShock 4 over USB or Bluetooth in Chrome and Edge.",
    add: 'Add device',
    hint: 'If nothing shows up, close Steam, PS Remote Play, DS4Windows or reWASD: they grab the HID reports first. Bluetooth pads start in a reduced mode; the app switches them to full reports automatically.',
    noWebHid:
      'This browser has no WebHID. Pro Mode needs desktop Chrome or Edge. Everything on the other tabs still works here.',
    noneSelected: 'No controller selected.',
  },
} as const
