import type { Dict } from './index'
export const ko: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'PS5 DualSense, PS4 DualShock 4, Xbox 및 모든 게임패드를 브라우저에서 테스트: 버튼, 스틱 드리프트, 원형도, 진동, 적응형 트리거, 라이트바, 터치패드, 자이로.',
  },
  nav: {
    proMode: '프로 모드',
    report: '리포트',
    home: '홈',
    theme: '테마 전환',
    language: '언어',
    auto: '자동',
    activePad: '활성 컨트롤러',
    skip: '본문으로 건너뛰기',
  },
  hero: {
    eyebrow: '무료 · 브라우저에서 실행 · 업로드 없음',
    title: '모든 버튼, 스틱, 트리거를 몇 초 만에 테스트.',
    lead: 'DualSense, DualSense Edge, DualShock 4, Xbox 및 모든 게임패드의 드리프트, 데드존, 원형도, 폴링 속도, 진동, 적응형 트리거를 확인합니다. 설치도 계정도 필요 없습니다.',
    add: '기기 추가',
    pro: '프로 모드 열기',
    art: 'DualSense 컨트롤러, 데모',
  },
  add: {
    title: '기기 추가',
    step1: '아무 버튼이나 누르기',
    step1Body:
      'USB로 연결하거나 블루투스로 페어링한 뒤 아무 버튼이나 누르세요. 브라우저는 첫 입력이 있어야 게임패드를 표시합니다. DualSense, DualShock 4, Xbox, 일반 패드를 지원합니다.',
    listening: '컨트롤러를 기다리는 중…',
    noGamepad:
      '{engine}에는 Gamepad API가 없습니다. Chrome, Edge, Firefox 또는 Safari를 사용해 보세요.',
    step2: '프로 모드용 페어링',
    step2Body:
      'WebHID는 컨트롤러와 직접 통신합니다: 적응형 트리거, 라이트바, 플레이어 LED, 마이크 LED, 터치패드, 자이로, 배터리, 펌웨어. DualSense, DualSense Edge, DualShock 4 지원.',
    pair: 'USB 또는 블루투스로 페어링',
    pairing: '선택 창을 기다리는 중…',
    noWebHid:
      '{engine}에서는 사용할 수 없습니다. 프로 모드에는 데스크톱 Chrome 또는 Edge가 필요합니다.',
    thisBrowser: '이 브라우저',
    table: {
      feature: '기능',
      buttons: '버튼, 스틱, 트리거',
      rumble: '진동',
      triggerRumble: '트리거 진동 (Xbox)',
      pro: '프로 모드 (WebHID를 통한 PS4/PS5)',
      partial: '일부',
      winmac: 'Win/mac',
      desktop: '데스크톱',
    },
  },
  showcase: {
    title: 'PlayStation 컨트롤러를 위해 만들어짐',
    lead: '각 패드의 정확한 도면이 누르는 대로 빛납니다. 카드에 마우스를 올려 프로 모드가 다룰 수 있는 부분을 확인하세요.',
    dualsense: {
      name: 'DualSense',
      tagline: 'PS5 무선 컨트롤러',
      callouts: ['적응형 트리거', '터치패드 + 라이트바', '마이크 음소거'],
      facts: [
        '적응형 트리거 효과',
        '라이트바 + 플레이어 LED',
        '햅틱 진동',
        '자이로, 가속도, 배터리',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'PS5 프로 컨트롤러',
      callouts: ['후면 패들', 'Fn 키', '스틱 모듈'],
      facts: ['DualSense의 모든 기능', '후면 패들 + Fn 키', '트리거 스톱', '교체형 스틱 모듈'],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'PS4 무선 컨트롤러',
      callouts: ['라이트바', '터치패드', 'Share / Options'],
      facts: [
        '라이트바 색상 + 깜빡임',
        '터치패드, 자이로, 가속도',
        '진동',
        'USB, 블루투스 또는 동글',
      ],
    },
  },
  tour: {
    title: '이 앱이 테스트할 수 있는 모든 것',
    noPad: '패드 불필요',
    sticks: { title: '스틱', blurb: '드리프트, 데드존, 원형도, 해상도를 실시간 궤적으로.' },
    triggers: { title: '트리거', blurb: '이동 곡선, 지연 시간, 적응형 트리거 효과.' },
    buttons: { title: '버튼', blurb: '모든 입력, 채터링과 고착 버튼 감지 포함.' },
    haptics: { title: '진동', blurb: '듀얼 진동과 트리거 진동 패턴을 원할 때.' },
    wizard: { title: '상태 점검', blurb: '여섯 단계로 내보낼 수 있는 0–100 점수를.' },
    pro: { title: '프로 모드', blurb: 'WebHID: 라이트바, LED, 마이크, 터치패드, 자이로, 배터리.' },
    learn: { title: '매핑 학습', blurb: '표준 레이아웃이 없는 패드를 앱에 가르칩니다.' },
    report: { title: '리포트', blurb: '마지막 상태 점검을 공유용 이미지로.' },
  },
  tabs: {
    overview: '개요',
    sticks: '스틱',
    triggers: '트리거',
    buttons: '버튼',
    haptics: '진동',
    wizard: '상태 점검',
    pro: '프로 모드',
    learn: '매핑 학습',
    report: '리포트',
  },
  shell: {
    emptyTitle: '컨트롤러를 연결하고 아무 버튼이나 누르세요',
    emptyBody:
      'USB 또는 블루투스. 브라우저는 첫 입력이 있어야 게임패드를 표시합니다. Chrome과 Edge의 프로 모드는 이 단계가 필요 없습니다.',
    footer:
      '모든 것이 브라우저에서 실행되며 아무것도 업로드되지 않습니다. 폴링 속도와 지연 시간은 하드웨어가 보내는 값이 아니라 브라우저가 관측한 값입니다.',
    standard: '표준',
    unmapped: '미매핑',
    pro: '프로',
  },
  footer: {
    privacy: '모든 것이 브라우저에서 실행되며 아무것도 업로드되지 않습니다.',
    github: 'GitHub',
    licences: '라이선스',
  },
  pro: {
    title: '프로 모드 (WebHID)',
    body: 'Gamepad API가 닿지 않는 부분을 컨트롤러와 직접 통신합니다: 적응형 트리거, 라이트바, 플레이어 LED, 마이크 LED, 터치패드, 자이로와 가속도계, 배터리, 펌웨어, 공장 데이터. Chrome과 Edge에서 USB 또는 블루투스로 DualSense, DualSense Edge, DualShock 4를 지원합니다.',
    add: '기기 추가',
    hint: '아무것도 나타나지 않으면 Steam, PS Remote Play, DS4Windows, reWASD를 종료하세요. 이들이 HID 리포트를 먼저 가져갑니다. 블루투스 패드는 축소 모드로 시작하며 앱이 자동으로 전체 리포트로 전환합니다.',
    noWebHid:
      '이 브라우저에는 WebHID가 없습니다. 프로 모드에는 데스크톱 Chrome 또는 Edge가 필요합니다. 다른 탭은 여기서도 작동합니다.',
    noneSelected: '선택된 컨트롤러가 없습니다.',
  },
}
