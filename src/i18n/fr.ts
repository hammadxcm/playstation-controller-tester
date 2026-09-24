import type { Dict } from './index'
export const fr: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'Testez la DualSense PS5, la DualShock 4 PS4, la manette Xbox ou n’importe quelle manette dans le navigateur : boutons, dérive des sticks, circularité, vibration, gâchettes adaptatives, barre lumineuse, pavé tactile, gyroscope.',
  },
  nav: {
    proMode: 'Mode Pro',
    report: 'Rapport',
    home: 'Accueil',
    theme: 'Changer de thème',
    language: 'Langue',
    auto: 'Auto',
    activePad: 'Manette active',
    skip: 'Aller au contenu',
    menu: 'Menu',
  },
  hero: {
    eyebrow: 'Gratuit · dans le navigateur · rien n’est envoyé',
    title: 'Chaque bouton, stick et gâchette. Testés en quelques secondes.',
    lead: 'Dérive, zones mortes, circularité, fréquence de lecture, vibration et gâchettes adaptatives pour DualSense, DualSense Edge, DualShock 4, Xbox et toute manette. Sans installation, sans compte.',
    add: 'Ajouter un appareil',
    pro: 'Ouvrir le Mode Pro',
    art: 'Manette DualSense, démonstration',
  },
  add: {
    title: 'Ajouter un appareil',
    step1: 'Appuyez sur un bouton',
    step1Body:
      'Branchez en USB ou appairez en Bluetooth, puis appuyez sur n’importe quel bouton. Les navigateurs ne révèlent une manette qu’après sa première entrée. Fonctionne avec DualSense, DualShock 4, Xbox et les manettes génériques.',
    listening: 'En attente d’une manette…',
    noGamepad: '{engine} n’a pas de Gamepad API. Essayez Chrome, Edge, Firefox ou Safari.',
    step2: 'Appairer pour le Mode Pro',
    step2Body:
      'WebHID parle directement à la manette : gâchettes adaptatives, barre lumineuse, LED joueur, LED micro, pavé tactile, gyroscope, batterie et firmware. DualSense, DualSense Edge et DualShock 4.',
    pair: 'Appairer en USB ou Bluetooth',
    pairing: 'En attente du sélecteur…',
    noWebHid: 'Indisponible dans {engine}. Le Mode Pro nécessite Chrome ou Edge sur ordinateur.',
    thisBrowser: 'ce navigateur',
    table: {
      feature: 'Fonction',
      buttons: 'Boutons, sticks, gâchettes',
      rumble: 'Vibration',
      triggerRumble: 'Vibration des gâchettes (Xbox)',
      pro: 'Mode Pro (PS4/PS5 via WebHID)',
      partial: 'partiel',
      winmac: 'Win/mac',
      desktop: 'ordinateur',
    },
  },
  showcase: {
    title: 'Conçu pour les manettes PlayStation',
    lead: 'Des dessins fidèles de chaque manette s’allument quand vous appuyez. Survolez une carte pour voir ce que le Mode Pro atteint.',
    dualsense: {
      name: 'DualSense',
      tagline: 'Manette sans fil PS5',
      callouts: ['Gâchettes adaptatives', 'Pavé tactile + barre lumineuse', 'Coupure micro'],
      facts: [
        'Effets de gâchettes adaptatives',
        'Barre lumineuse + LED joueur',
        'Vibration haptique',
        'Gyroscope, accéléromètre, batterie',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'Manette pro PS5',
      callouts: ['Palettes arrière', 'Touches Fn', 'Modules de stick'],
      facts: [
        'Tout ce que fait la DualSense',
        'Palettes arrière + touches Fn',
        'Butées de gâchette',
        'Modules de stick interchangeables',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'Manette sans fil PS4',
      callouts: ['Barre lumineuse', 'Pavé tactile', 'Share / Options'],
      facts: [
        'Couleur et clignotement de la barre',
        'Pavé tactile, gyroscope, accéléromètre',
        'Vibration',
        'USB, Bluetooth ou dongle',
      ],
    },
  },
  tour: {
    title: 'Tout ce que l’app peut tester',
    noPad: 'Sans manette',
    sticks: {
      title: 'Sticks',
      blurb: 'Dérive, zone morte, circularité et résolution avec tracé en direct.',
    },
    triggers: {
      title: 'Gâchettes',
      blurb: 'Courbes de course, latence et effets de gâchettes adaptatives.',
    },
    buttons: {
      title: 'Boutons',
      blurb: 'Chaque entrée, avec détection de rebonds et de boutons bloqués.',
    },
    haptics: {
      title: 'Vibration',
      blurb: 'Motifs de double vibration et de vibration des gâchettes, à la demande.',
    },
    wizard: { title: 'Bilan', blurb: 'Six étapes guidées vers un score de 0 à 100 exportable.' },
    pro: {
      title: 'Mode Pro',
      blurb: 'WebHID : barre lumineuse, LED, micro, pavé tactile, gyroscope, batterie.',
    },
    learn: {
      title: 'Apprendre le mappage',
      blurb: 'Apprenez à l’app une manette sans disposition standard.',
    },
    report: { title: 'Rapport', blurb: 'Votre dernier bilan en image à partager.' },
  },
  tabs: {
    overview: 'Aperçu',
    sticks: 'Sticks',
    triggers: 'Gâchettes',
    buttons: 'Boutons',
    haptics: 'Vibration',
    wizard: 'Bilan',
    pro: 'Mode Pro',
    learn: 'Apprendre le mappage',
    report: 'Rapport',
  },
  shell: {
    emptyTitle: 'Connectez une manette et appuyez sur un bouton',
    emptyBody:
      'USB ou Bluetooth. Les navigateurs ne révèlent une manette qu’après sa première entrée. Le Mode Pro se passe de cette étape dans Chrome et Edge.',
    footer:
      'Tout s’exécute dans votre navigateur ; rien n’est envoyé. Les fréquences et latences sont celles observées par le navigateur, pas celles émises par le matériel.',
    standard: 'standard',
    unmapped: 'non mappée',
    pro: 'Pro',
  },
  footer: {
    privacy: 'Tout s’exécute dans votre navigateur ; rien n’est envoyé.',
    github: 'GitHub',
    licences: 'Licences',
    portfolio: 'Portfolio',
    site: 'Site web',
    by: 'Créé par',
  },
  pro: {
    title: 'Mode Pro (WebHID)',
    body: 'Parlez directement à la manette pour ce que la Gamepad API n’atteint pas : gâchettes adaptatives, barre lumineuse, LED joueur, LED micro, pavé tactile, gyroscope et accéléromètre, batterie, firmware et données d’usine. DualSense, DualSense Edge et DualShock 4 en USB ou Bluetooth dans Chrome et Edge.',
    add: 'Ajouter un appareil',
    hint: 'Si rien n’apparaît, fermez Steam, PS Remote Play, DS4Windows ou reWASD : ils captent les rapports HID en premier. Les manettes Bluetooth démarrent en mode réduit ; l’app passe automatiquement aux rapports complets.',
    noWebHid:
      'Ce navigateur n’a pas WebHID. Le Mode Pro nécessite Chrome ou Edge sur ordinateur. Tout le reste fonctionne ici.',
    noneSelected: 'Aucune manette sélectionnée.',
  },
}
