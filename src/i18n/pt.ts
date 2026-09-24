import type { Dict } from './index'
export const pt: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'Teste o DualSense do PS5, o DualShock 4 do PS4, o Xbox ou qualquer controle no navegador: botões, drift dos analógicos, circularidade, vibração, gatilhos adaptáveis, barra de luz, touchpad e giroscópio.',
  },
  nav: {
    proMode: 'Modo Pro',
    report: 'Relatório',
    home: 'Início',
    theme: 'Alternar tema',
    language: 'Idioma',
    auto: 'Automático',
    activePad: 'Controle ativo',
    skip: 'Ir para o conteúdo',
    menu: 'Menu',
  },
  hero: {
    eyebrow: 'Grátis · no navegador · nada é enviado',
    title: 'Cada botão, analógico e gatilho. Testado em segundos.',
    lead: 'Drift, zonas mortas, circularidade, taxa de leitura, vibração e gatilhos adaptáveis para DualSense, DualSense Edge, DualShock 4, Xbox e qualquer controle. Sem instalação, sem conta.',
    add: 'Adicionar dispositivo',
    pro: 'Abrir Modo Pro',
    art: 'Controle DualSense, demonstração',
  },
  add: {
    title: 'Adicionar dispositivo',
    step1: 'Pressione qualquer botão',
    step1Body:
      'Conecte por USB ou pareie por Bluetooth e pressione qualquer botão. Os navegadores só mostram um controle após a primeira entrada. Funciona com DualSense, DualShock 4, Xbox e controles genéricos.',
    listening: 'Aguardando um controle…',
    noGamepad: '{engine} não tem Gamepad API. Tente Chrome, Edge, Firefox ou Safari.',
    step2: 'Parear para o Modo Pro',
    step2Body:
      'O WebHID fala diretamente com o controle: gatilhos adaptáveis, barra de luz, LEDs de jogador, LED do microfone, touchpad, giroscópio, bateria e firmware. DualSense, DualSense Edge e DualShock 4.',
    pair: 'Parear por USB ou Bluetooth',
    pairing: 'Aguardando o seletor…',
    noWebHid: 'Indisponível no {engine}. O Modo Pro precisa do Chrome ou Edge para desktop.',
    thisBrowser: 'este navegador',
    table: {
      feature: 'Recurso',
      buttons: 'Botões, analógicos, gatilhos',
      rumble: 'Vibração',
      triggerRumble: 'Vibração nos gatilhos (Xbox)',
      pro: 'Modo Pro (PS4/PS5 via WebHID)',
      partial: 'parcial',
      winmac: 'Win/mac',
      desktop: 'desktop',
    },
  },
  showcase: {
    title: 'Feito para controles PlayStation',
    lead: 'Desenhos precisos de cada controle acendem conforme você pressiona. Passe o mouse em um cartão para ver o que o Modo Pro alcança.',
    dualsense: {
      name: 'DualSense',
      tagline: 'Controle sem fio do PS5',
      callouts: ['Gatilhos adaptáveis', 'Touchpad + barra de luz', 'Mudo do microfone'],
      facts: [
        'Efeitos de gatilho adaptável',
        'Barra de luz + LEDs de jogador',
        'Vibração háptica',
        'Giroscópio, acelerômetro, bateria',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'Controle pro do PS5',
      callouts: ['Paddles traseiros', 'Teclas Fn', 'Módulos de analógico'],
      facts: [
        'Tudo que o DualSense faz',
        'Paddles traseiros + teclas Fn',
        'Limitadores de gatilho',
        'Módulos de analógico intercambiáveis',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'Controle sem fio do PS4',
      callouts: ['Barra de luz', 'Touchpad', 'Share / Options'],
      facts: [
        'Cor e piscar da barra de luz',
        'Touchpad, giroscópio, acelerômetro',
        'Vibração',
        'USB, Bluetooth ou adaptador',
      ],
    },
  },
  tour: {
    title: 'Tudo que o app pode testar',
    noPad: 'Sem controle',
    sticks: {
      title: 'Analógicos',
      blurb: 'Drift, zona morta, circularidade e resolução com traço ao vivo.',
    },
    triggers: {
      title: 'Gatilhos',
      blurb: 'Curvas de curso, latência e efeitos de gatilho adaptável.',
    },
    buttons: { title: 'Botões', blurb: 'Cada entrada, com detecção de repique e botões presos.' },
    haptics: { title: 'Vibração', blurb: 'Padrões de vibração dupla e nos gatilhos, sob demanda.' },
    wizard: {
      title: 'Diagnóstico',
      blurb: 'Seis passos guiados até uma nota de 0 a 100 exportável.',
    },
    pro: {
      title: 'Modo Pro',
      blurb: 'WebHID: barra de luz, LEDs, microfone, touchpad, giroscópio, bateria.',
    },
    learn: {
      title: 'Aprender mapeamento',
      blurb: 'Ensine o app a usar um controle sem layout padrão.',
    },
    report: { title: 'Relatório', blurb: 'Seu último diagnóstico como imagem para compartilhar.' },
  },
  tabs: {
    overview: 'Visão geral',
    sticks: 'Analógicos',
    triggers: 'Gatilhos',
    buttons: 'Botões',
    haptics: 'Vibração',
    wizard: 'Diagnóstico',
    pro: 'Modo Pro',
    learn: 'Aprender mapeamento',
    report: 'Relatório',
  },
  shell: {
    emptyTitle: 'Conecte um controle e pressione qualquer botão',
    emptyBody:
      'USB ou Bluetooth. Os navegadores só mostram um controle após a primeira entrada. O Modo Pro dispensa esse passo no Chrome e no Edge.',
    footer:
      'Tudo roda no seu navegador; nada é enviado. Taxa de leitura e latência são o que o navegador observa, não o que o hardware envia.',
    standard: 'padrão',
    unmapped: 'sem mapa',
    pro: 'Pro',
  },
  footer: {
    privacy: 'Tudo roda no seu navegador; nada é enviado.',
    github: 'GitHub',
    licences: 'Licenças',
  },
  pro: {
    title: 'Modo Pro (WebHID)',
    body: 'Fale diretamente com o controle para o que a Gamepad API não alcança: gatilhos adaptáveis, barra de luz, LEDs de jogador, LED do microfone, touchpad, giroscópio e acelerômetro, bateria, firmware e dados de fábrica. DualSense, DualSense Edge e DualShock 4 por USB ou Bluetooth no Chrome e no Edge.',
    add: 'Adicionar dispositivo',
    hint: 'Se nada aparecer, feche Steam, PS Remote Play, DS4Windows ou reWASD: eles capturam os relatórios HID primeiro. Controles Bluetooth iniciam em modo reduzido; o app muda para relatórios completos automaticamente.',
    noWebHid:
      'Este navegador não tem WebHID. O Modo Pro precisa do Chrome ou Edge para desktop. Todo o resto funciona aqui.',
    noneSelected: 'Nenhum controle selecionado.',
  },
}
