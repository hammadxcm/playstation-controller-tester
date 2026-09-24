import type { Dict } from './index'
export const es: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'Prueba tu DualSense de PS5, DualShock 4 de PS4, Xbox o cualquier mando en el navegador: botones, deriva de sticks, circularidad, vibración, gatillos adaptativos, barra de luz, panel táctil y giroscopio.',
  },
  nav: {
    proMode: 'Modo Pro',
    report: 'Informe',
    home: 'Inicio',
    theme: 'Cambiar tema',
    language: 'Idioma',
    auto: 'Automático',
    activePad: 'Mando activo',
    skip: 'Ir al contenido',
    menu: 'Menú',
  },
  hero: {
    eyebrow: 'Gratis · en el navegador · nada se sube',
    title: 'Cada botón, stick y gatillo. Probado en segundos.',
    lead: 'Deriva, zonas muertas, circularidad, frecuencia de sondeo, vibración y gatillos adaptativos para DualSense, DualSense Edge, DualShock 4, Xbox y cualquier mando. Sin instalar nada, sin cuenta.',
    add: 'Añadir un dispositivo',
    pro: 'Abrir Modo Pro',
    art: 'Mando DualSense, demostración',
  },
  add: {
    title: 'Añadir un dispositivo',
    step1: 'Pulsa cualquier botón',
    step1Body:
      'Conéctalo por USB o empareja por Bluetooth y pulsa cualquier botón. Los navegadores solo muestran un mando tras su primera pulsación. Funciona con DualSense, DualShock 4, Xbox y mandos genéricos.',
    listening: 'Esperando un mando…',
    noGamepad: '{engine} no tiene Gamepad API. Prueba Chrome, Edge, Firefox o Safari.',
    step2: 'Emparejar para el Modo Pro',
    step2Body:
      'WebHID habla directamente con el mando: gatillos adaptativos, barra de luz, LED de jugador, LED del micrófono, panel táctil, giroscopio, batería y firmware. DualSense, DualSense Edge y DualShock 4.',
    pair: 'Emparejar por USB o Bluetooth',
    pairing: 'Esperando el selector…',
    noWebHid: 'No disponible en {engine}. El Modo Pro necesita Chrome o Edge de escritorio.',
    thisBrowser: 'este navegador',
    table: {
      feature: 'Función',
      buttons: 'Botones, sticks, gatillos',
      rumble: 'Vibración',
      triggerRumble: 'Vibración en gatillos (Xbox)',
      pro: 'Modo Pro (PS4/PS5 vía WebHID)',
      partial: 'parcial',
      winmac: 'Win/mac',
      desktop: 'escritorio',
    },
  },
  showcase: {
    title: 'Hecho para mandos PlayStation',
    lead: 'Dibujos precisos de cada mando que se iluminan al pulsar. Pasa el cursor por una tarjeta para ver lo que alcanza el Modo Pro.',
    dualsense: {
      name: 'DualSense',
      tagline: 'Mando inalámbrico de PS5',
      callouts: ['Gatillos adaptativos', 'Panel táctil + barra de luz', 'Silencio de micro'],
      facts: [
        'Efectos de gatillos adaptativos',
        'Barra de luz + LED de jugador',
        'Vibración háptica',
        'Giroscopio, acelerómetro, batería',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'Mando pro de PS5',
      callouts: ['Palancas traseras', 'Teclas Fn', 'Módulos de stick'],
      facts: [
        'Todo lo del DualSense',
        'Palancas traseras + teclas Fn',
        'Topes de gatillo',
        'Módulos de stick intercambiables',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'Mando inalámbrico de PS4',
      callouts: ['Barra de luz', 'Panel táctil', 'Share / Options'],
      facts: [
        'Color y parpadeo de la barra de luz',
        'Panel táctil, giroscopio, acelerómetro',
        'Vibración',
        'USB, Bluetooth o adaptador',
      ],
    },
  },
  tour: {
    title: 'Todo lo que la app puede probar',
    noPad: 'Sin mando',
    sticks: {
      title: 'Sticks',
      blurb: 'Deriva, zona muerta, circularidad y resolución con trazo en vivo.',
    },
    triggers: {
      title: 'Gatillos',
      blurb: 'Curvas de recorrido, latencia y efectos de gatillos adaptativos.',
    },
    buttons: {
      title: 'Botones',
      blurb: 'Cada entrada, con detección de rebotes y botones atascados.',
    },
    haptics: { title: 'Vibración', blurb: 'Patrones de vibración doble y en gatillos, a demanda.' },
    wizard: {
      title: 'Chequeo',
      blurb: 'Seis pasos guiados hasta una puntuación de 0 a 100 exportable.',
    },
    pro: {
      title: 'Modo Pro',
      blurb: 'WebHID: barra de luz, LED, micro, panel táctil, giroscopio, batería.',
    },
    learn: {
      title: 'Aprender mapeo',
      blurb: 'Enseña a la app un mando sin distribución estándar.',
    },
    report: { title: 'Informe', blurb: 'Tu último chequeo como imagen para compartir.' },
  },
  tabs: {
    overview: 'Resumen',
    sticks: 'Sticks',
    triggers: 'Gatillos',
    buttons: 'Botones',
    haptics: 'Vibración',
    wizard: 'Chequeo',
    pro: 'Modo Pro',
    learn: 'Aprender mapeo',
    report: 'Informe',
  },
  shell: {
    emptyTitle: 'Conecta un mando y pulsa cualquier botón',
    emptyBody:
      'USB o Bluetooth. Los navegadores solo muestran un mando tras su primera pulsación. El Modo Pro funciona sin este paso en Chrome y Edge.',
    footer:
      'Todo se ejecuta en tu navegador; nada se sube. Las cifras de frecuencia y latencia son las que observa el navegador, no las que envía el hardware.',
    standard: 'estándar',
    unmapped: 'sin mapear',
    pro: 'Pro',
  },
  footer: {
    privacy: 'Todo se ejecuta en tu navegador; nada se sube.',
    github: 'GitHub',
    licences: 'Licencias',
    portfolio: 'Portafolio',
    site: 'Sitio web',
    by: 'Hecho por',
  },
  pro: {
    title: 'Modo Pro (WebHID)',
    body: 'Habla directamente con el mando para lo que la Gamepad API no alcanza: gatillos adaptativos, barra de luz, LED de jugador, LED del micro, panel táctil, giroscopio y acelerómetro, batería, firmware y datos de fábrica. DualSense, DualSense Edge y DualShock 4 por USB o Bluetooth en Chrome y Edge.',
    add: 'Añadir dispositivo',
    hint: 'Si no aparece nada, cierra Steam, PS Remote Play, DS4Windows o reWASD: capturan los informes HID antes. Los mandos Bluetooth arrancan en modo reducido; la app los pasa a informes completos automáticamente.',
    noWebHid:
      'Este navegador no tiene WebHID. El Modo Pro necesita Chrome o Edge de escritorio. Todo lo demás funciona aquí.',
    noneSelected: 'No se seleccionó ningún mando.',
  },
}
