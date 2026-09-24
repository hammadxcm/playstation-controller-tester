import type { Dict } from './index'
export const ja: Dict = {
  app: {
    title: 'Controller Tester',
    description:
      'PS5 DualSense、PS4 DualShock 4、Xbox などあらゆるゲームパッドをブラウザでテスト。ボタン、スティックのドリフト、円形精度、振動、アダプティブトリガー、ライトバー、タッチパッド、ジャイロ。',
  },
  nav: {
    proMode: 'Pro モード',
    report: 'レポート',
    home: 'ホーム',
    theme: 'テーマを切り替え',
    language: '言語',
    auto: '自動',
    activePad: '使用中のコントローラー',
    skip: 'コンテンツへ移動',
    menu: 'メニュー',
  },
  hero: {
    eyebrow: '無料 · ブラウザ内で完結 · データ送信なし',
    title: 'すべてのボタン、スティック、トリガーを数秒でテスト。',
    lead: 'DualSense、DualSense Edge、DualShock 4、Xbox などあらゆるゲームパッドのドリフト、デッドゾーン、円形精度、ポーリングレート、振動、アダプティブトリガーを確認。インストールもアカウントも不要。',
    add: 'デバイスを追加',
    pro: 'Pro モードを開く',
    art: 'DualSense コントローラー、デモ',
  },
  add: {
    title: 'デバイスを追加',
    step1: 'いずれかのボタンを押す',
    step1Body:
      'USB で接続するか Bluetooth でペアリングし、いずれかのボタンを押してください。ブラウザは最初の入力があるまでゲームパッドを表示しません。DualSense、DualShock 4、Xbox、汎用パッドに対応。',
    listening: 'コントローラーを待機中…',
    noGamepad:
      '{engine} には Gamepad API がありません。Chrome、Edge、Firefox、Safari をお試しください。',
    step2: 'Pro モード用にペアリング',
    step2Body:
      'WebHID はコントローラーと直接通信します。アダプティブトリガー、ライトバー、プレイヤー LED、マイク LED、タッチパッド、ジャイロ、バッテリー、ファームウェア。DualSense、DualSense Edge、DualShock 4 に対応。',
    pair: 'USB または Bluetooth でペアリング',
    pairing: '選択画面を待機中…',
    noWebHid:
      '{engine} では利用できません。Pro モードにはデスクトップ版 Chrome または Edge が必要です。',
    thisBrowser: 'このブラウザ',
    table: {
      feature: '機能',
      buttons: 'ボタン、スティック、トリガー',
      rumble: '振動',
      triggerRumble: 'トリガー振動（Xbox）',
      pro: 'Pro モード（WebHID 経由の PS4/PS5）',
      partial: '一部',
      winmac: 'Win/mac',
      desktop: 'デスクトップ',
    },
  },
  showcase: {
    title: 'PlayStation コントローラーのために',
    lead: '各パッドの正確な図が押した箇所に合わせて光ります。カードにカーソルを合わせると Pro モードで扱える部分が表示されます。',
    dualsense: {
      name: 'DualSense',
      tagline: 'PS5 ワイヤレスコントローラー',
      callouts: ['アダプティブトリガー', 'タッチパッド + ライトバー', 'マイクミュート'],
      facts: [
        'アダプティブトリガー効果',
        'ライトバー + プレイヤー LED',
        'ハプティック振動',
        'ジャイロ、加速度、バッテリー',
      ],
    },
    dualsenseEdge: {
      name: 'DualSense Edge',
      tagline: 'PS5 プロコントローラー',
      callouts: ['背面パドル', 'Fn キー', 'スティックモジュール'],
      facts: [
        'DualSense の全機能',
        '背面パドル + Fn キー',
        'トリガーストップ',
        '交換式スティックモジュール',
      ],
    },
    dualshock4: {
      name: 'DualShock 4',
      tagline: 'PS4 ワイヤレスコントローラー',
      callouts: ['ライトバー', 'タッチパッド', 'Share / Options'],
      facts: [
        'ライトバーの色と点滅',
        'タッチパッド、ジャイロ、加速度',
        '振動',
        'USB、Bluetooth、ドングル',
      ],
    },
  },
  tour: {
    title: 'このアプリでテストできること',
    noPad: 'パッド不要',
    sticks: {
      title: 'スティック',
      blurb: 'ドリフト、デッドゾーン、円形精度、分解能をライブ軌跡で確認。',
    },
    triggers: { title: 'トリガー', blurb: 'ストローク曲線、遅延、アダプティブトリガー効果。' },
    buttons: { title: 'ボタン', blurb: 'すべての入力、チャタリングと固着の検出付き。' },
    haptics: { title: '振動', blurb: 'デュアル振動とトリガー振動のパターンをオンデマンドで。' },
    wizard: {
      title: 'ヘルスチェック',
      blurb: '6 つのステップで 0〜100 のスコアを出力・エクスポート。',
    },
    pro: {
      title: 'Pro モード',
      blurb: 'WebHID：ライトバー、LED、マイク、タッチパッド、ジャイロ、バッテリー。',
    },
    learn: { title: 'マッピング学習', blurb: '標準レイアウトのないパッドをアプリに覚えさせます。' },
    report: { title: 'レポート', blurb: '最後のヘルスチェックを共有用画像に。' },
  },
  tabs: {
    overview: '概要',
    sticks: 'スティック',
    triggers: 'トリガー',
    buttons: 'ボタン',
    haptics: '振動',
    wizard: 'ヘルスチェック',
    pro: 'Pro モード',
    learn: 'マッピング学習',
    report: 'レポート',
  },
  shell: {
    emptyTitle: 'コントローラーを接続していずれかのボタンを押してください',
    emptyBody:
      'USB または Bluetooth。ブラウザは最初の入力があるまでゲームパッドを表示しません。Chrome と Edge の Pro モードではこの手順は不要です。',
    footer:
      'すべてブラウザ内で動作し、何も送信されません。ポーリングレートと遅延の値はブラウザが観測したもので、ハードウェアが送信した値ではありません。',
    standard: '標準',
    unmapped: '未割り当て',
    pro: 'Pro',
  },
  footer: {
    privacy: 'すべてブラウザ内で動作し、何も送信されません。',
    github: 'GitHub',
    licences: 'ライセンス',
    portfolio: 'ポートフォリオ',
    site: 'ウェブサイト',
    by: '制作',
  },
  pro: {
    title: 'Pro モード（WebHID）',
    body: 'Gamepad API では届かない部分をコントローラーと直接やり取りします。アダプティブトリガー、ライトバー、プレイヤー LED、マイク LED、タッチパッド、ジャイロと加速度センサー、バッテリー、ファームウェア、工場データ。Chrome と Edge で USB または Bluetooth 経由の DualSense、DualSense Edge、DualShock 4 に対応。',
    add: 'デバイスを追加',
    hint: '何も表示されない場合は Steam、PS Remote Play、DS4Windows、reWASD を終了してください。これらが先に HID レポートを取得します。Bluetooth パッドは縮小モードで起動しますが、アプリが自動的にフルレポートへ切り替えます。',
    noWebHid:
      'このブラウザには WebHID がありません。Pro モードにはデスクトップ版 Chrome または Edge が必要です。他のタブはここでも動作します。',
    noneSelected: 'コントローラーが選択されていません。',
  },
}
