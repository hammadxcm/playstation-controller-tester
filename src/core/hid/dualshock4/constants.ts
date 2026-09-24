export const REPORT = {
  inputUsb: 0x01,
  inputBt: 0x11,
  outputUsb: 0x05,
  outputBt: 0x11,
  featCalibrationUsb: 0x02,
  featCalibrationBt: 0x05,
} as const
export const SIZE = { state: 32, outputUsb: 31, outputBt: 77 } as const
export const FLAG = { rumble: 1 << 0, lightbar: 1 << 1, flash: 1 << 2 } as const
export const TOUCHPAD = { width: 1920, height: 942 }
export const SENSOR = { gyroPerDps: 16, accelPerG: 8192 }
