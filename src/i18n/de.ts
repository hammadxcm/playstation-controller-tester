import type { Dict } from './index'
export const de: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'Teste PS5 DualSense, PS4 DualShock 4, Xbox und jedes Gamepad im Browser: Tasten, Stick-Drift, Zirkularität, Vibration, adaptive Trigger, Lichtleiste, Touchpad, Gyroskop.',
  },
  nav: {
    proMode: 'Pro-Modus',
    report: 'Bericht',
    home: 'Start',
    theme: 'Design wechseln',
    language: 'Sprache',
    auto: 'Automatisch',
    activePad: 'Aktiver Controller',
    skip: 'Zum Inhalt springen',
  },
  hero: {
    eyebrow: 'Kostenlos · im Browser · nichts wird hochgeladen',
    title: 'Jede Taste, jeder Stick, jeder Trigger. In Sekunden geprüft.',
    lead: 'Drift, Totzonen, Zirkularität, Abfragerate, Vibration und adaptive Trigger für DualSense, DualSense Edge, DualShock 4, Xbox und jedes Gamepad. Keine Installation, kein Konto.',
    add: 'Gerät hinzufügen',
    pro: 'Pro-Modus öffnen',
    art: 'DualSense-Controller, Demo',
  },
  add: {
    title: 'Gerät hinzufügen',
    step1: 'Beliebige Taste drücken',
    step1Body:
      'Per USB anschließen oder per Bluetooth koppeln, dann eine beliebige Taste drücken. Browser zeigen ein Gamepad erst nach der ersten Eingabe. Funktioniert mit DualSense, DualShock 4, Xbox und generischen Pads.',
    listening: 'Warte auf einen Controller…',
    noGamepad: '{engine} hat keine Gamepad-API. Probiere Chrome, Edge, Firefox oder Safari.',
    step2: 'Für den Pro-Modus koppeln',
    step2Body:
      'WebHID spricht direkt mit dem Controller: adaptive Trigger, Lichtleiste, Spieler-LEDs, Mikrofon-LED, Touchpad, Gyroskop, Akku und Firmware. DualSense, DualSense Edge und DualShock 4.',
    pair: 'Per USB oder Bluetooth koppeln',
    pairing: 'Warte auf die Auswahl…',
    noWebHid:
      'In {engine} nicht verfügbar. Der Pro-Modus braucht Chrome oder Edge auf dem Desktop.',
    thisBrowser: 'diesem Browser',
    table: {
      feature: 'Funktion',
      buttons: 'Tasten, Sticks, Trigger',
      rumble: 'Vibration',
      triggerRumble: 'Trigger-Vibration (Xbox)',
      pro: 'Pro-Modus (PS4/PS5 über WebHID)',
      partial: 'teilweise',
      winmac: 'Win/mac',
      desktop: 'Desktop',
    },
  },
  showcase: {
    title: 'Gemacht für PlayStation-Controller',
    lead: 'Präzise Zeichnungen jedes Pads leuchten beim Drücken auf. Fahre über eine Karte, um zu sehen, was der Pro-Modus erreicht.',
    dualsense: {
      name: 'DualSense',
      tagline: 'PS5 Wireless-Controller',
      callouts: ['Adaptive Trigger', 'Touchpad + Lichtleiste', 'Mikro stumm'],
      facts: [
        'Adaptive Trigger-Effekte',
        'Lichtleiste + Spieler-LEDs',
        'Haptische Vibration',
        'Gyroskop, Beschleunigung, Akku',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'PS5 Pro-Controller',
      callouts: ['Rückseitige Paddles', 'Fn-Tasten', 'Stick-Module'],
      facts: [
        'Alles, was DualSense kann',
        'Rückseitige Paddles + Fn-Tasten',
        'Trigger-Stopps',
        'Austauschbare Stick-Module',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'PS4 Wireless-Controller',
      callouts: ['Lichtleiste', 'Touchpad', 'Share / Options'],
      facts: [
        'Farbe und Blinken der Lichtleiste',
        'Touchpad, Gyroskop, Beschleunigung',
        'Vibration',
        'USB, Bluetooth oder Dongle',
      ],
    },
  },
  tour: {
    title: 'Alles, was die App testen kann',
    noPad: 'Ohne Pad',
    sticks: { title: 'Sticks', blurb: 'Drift, Totzone, Zirkularität und Auflösung mit Live-Spur.' },
    triggers: { title: 'Trigger', blurb: 'Wegkurven, Latenz und adaptive Trigger-Effekte.' },
    buttons: {
      title: 'Tasten',
      blurb: 'Jede Eingabe, mit Erkennung von Prellen und hängenden Tasten.',
    },
    haptics: { title: 'Vibration', blurb: 'Doppel- und Trigger-Vibrationsmuster auf Abruf.' },
    wizard: {
      title: 'Gesundheitscheck',
      blurb: 'Sechs geführte Schritte zu einem exportierbaren Score von 0 bis 100.',
    },
    pro: {
      title: 'Pro-Modus',
      blurb: 'WebHID: Lichtleiste, LEDs, Mikro, Touchpad, Gyroskop, Akku.',
    },
    learn: { title: 'Belegung lernen', blurb: 'Bringe der App ein Pad ohne Standardlayout bei.' },
    report: { title: 'Bericht', blurb: 'Dein letzter Check als teilbares Bild.' },
  },
  tabs: {
    overview: 'Übersicht',
    sticks: 'Sticks',
    triggers: 'Trigger',
    buttons: 'Tasten',
    haptics: 'Vibration',
    wizard: 'Gesundheitscheck',
    pro: 'Pro-Modus',
    learn: 'Belegung lernen',
    report: 'Bericht',
  },
  shell: {
    emptyTitle: 'Controller verbinden und eine Taste drücken',
    emptyBody:
      'USB oder Bluetooth. Browser zeigen ein Gamepad erst nach der ersten Eingabe. Der Pro-Modus kommt in Chrome und Edge ohne diesen Schritt aus.',
    footer:
      'Alles läuft im Browser; nichts wird hochgeladen. Abfragerate und Latenz sind das, was der Browser sieht, nicht das, was die Hardware sendet.',
    standard: 'Standard',
    unmapped: 'nicht belegt',
    pro: 'Pro',
  },
  footer: {
    privacy: 'Alles läuft im Browser; nichts wird hochgeladen.',
    github: 'GitHub',
    licences: 'Lizenzen',
  },
  pro: {
    title: 'Pro-Modus (WebHID)',
    body: 'Sprich direkt mit dem Controller für alles, was die Gamepad-API nicht erreicht: adaptive Trigger, Lichtleiste, Spieler-LEDs, Mikrofon-LED, Touchpad, Gyroskop und Beschleunigungssensor, Akku, Firmware und Werksdaten. DualSense, DualSense Edge und DualShock 4 per USB oder Bluetooth in Chrome und Edge.',
    add: 'Gerät hinzufügen',
    hint: 'Wenn nichts erscheint, schließe Steam, PS Remote Play, DS4Windows oder reWASD: Sie greifen die HID-Berichte zuerst ab. Bluetooth-Pads starten im reduzierten Modus; die App schaltet automatisch auf vollständige Berichte um.',
    noWebHid:
      'Dieser Browser hat kein WebHID. Der Pro-Modus braucht Chrome oder Edge auf dem Desktop. Alles andere funktioniert hier.',
    noneSelected: 'Kein Controller ausgewählt.',
  },
}
