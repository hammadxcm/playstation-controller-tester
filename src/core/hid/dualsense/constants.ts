export const REPORT = {
  inputUsb: 0x01,
  inputBt: 0x31,
  outputUsb: 0x02,
  outputBt: 0x31,
  featCalibration: 0x05,
  featFirmware: 0x20,
} as const

/**
 * USB output report 0x02 is 48 bytes on the wire (id + 47): that is what the descriptor declares and what
 * macOS enforces (MaxOutputReportSize = 48). The Linux driver's 63-byte struct pads with reserved bytes
 * that the descriptor never mentions; sending them makes IOKit refuse the write.
 */
export const SIZE = { state: 63, outputPayload: 47, outputUsb: 47, outputBt: 77 } as const

export const FLAG0 = {
  compatVibration: 1 << 0,
  haptics: 1 << 1,
  rightTrigger: 1 << 2,
  leftTrigger: 1 << 3,
  headphoneVolume: 1 << 4,
  speakerVolume: 1 << 5,
  micVolume: 1 << 6,
  audioControl: 1 << 7,
}
/** audio_control bits 5:4 — where channels 0/1 of the USB sound card go */
export const AUDIO_PATH = { headphones: 0, headphonesMono: 1, both: 2, speaker: 3 } as const
export const FLAG1 = {
  micLed: 1 << 0,
  powerSave: 1 << 1,
  lightbar: 1 << 2,
  releaseLeds: 1 << 3,
  playerLeds: 1 << 4,
}
export const FLAG2 = { ledBrightness: 1 << 0, lightbarSetup: 1 << 1, compatVibration2: 1 << 2 }

export const TOUCHPAD = { width: 1920, height: 1080 }
export const SENSOR = { gyroPerDps: 1024, accelPerG: 8192 }
export const BT_KEEPALIVE_MS = 500
