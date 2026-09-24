import { ActionId, DeviceId, testCommand, type CommandTarget } from './testCommand'

export interface FactoryInfo {
  serial?: string
  pcbaId?: string
  mcuUniqueId?: string
  btAddress?: string
  batteryMv?: number
  touchpadId?: string
  touchpadFirmware?: string
  assembleParts?: string
  batteryBarcode?: string
}

const trimZeros = (u: Uint8Array) => {
  let n = u.length
  while (n > 0 && u[n - 1] === 0) n--
  return u.subarray(0, n)
}
const hexBE = (u: Uint8Array) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('')
const ascii = (u: Uint8Array) =>
  Array.from(u)
    .filter((b) => b >= 0x20 && b < 0x7f)
    .map((b) => String.fromCharCode(b))
    .join('')
    .trim()

/** Read the factory data a DualSense exposes over the test-command channel. Missing fields mean the command failed. */
export async function readFactoryInfo(t: CommandTarget): Promise<FactoryInfo> {
  const info: FactoryInfo = {}
  const serial = await testCommand(t, DeviceId.SYSTEM, ActionId.READ_SERIAL_NUMBER, 32)
  if (serial) info.serial = ascii(serial)
  const pcba = await testCommand(t, DeviceId.SYSTEM, ActionId.READ_PCBAID, 6)
  if (pcba) info.pcbaId = hexBE(Uint8Array.from(pcba).reverse())
  const uid = await testCommand(t, DeviceId.SYSTEM, ActionId.GET_MCU_UNIQUE_ID, 9)
  if (uid && uid[0] === 0) info.mcuUniqueId = hexBE(uid.subarray(1).slice().reverse())
  const mac = await testCommand(t, DeviceId.BLUETOOTH, ActionId.READ_BDADR, 6)
  if (mac)
    info.btAddress = Array.from(Uint8Array.from(mac).reverse(), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join(':')
  const bat = await testCommand(t, DeviceId.ANALOG_DATA, ActionId.BATTERY, 4)
  if (bat) info.batteryMv = bat[0]! | (bat[1]! << 8)
  const tpId = await testCommand(t, DeviceId.TOUCH, ActionId.SOLOMON_UID, 8)
  if (tpId) info.touchpadId = hexBE(tpId)
  const tpFw = await testCommand(t, DeviceId.TOUCH, ActionId.SOLOMON_VERSION, 8)
  if (tpFw) info.touchpadFirmware = hexBE(tpFw)
  const parts = await testCommand(t, DeviceId.SYSTEM, ActionId.READ_ASSEMBLE_PARTS_INFO, 32)
  if (parts) info.assembleParts = ascii(parts) || hexBE(trimZeros(parts))
  const barcode = await testCommand(t, DeviceId.SYSTEM, ActionId.READ_BATTERY_BARCODE, 32)
  if (barcode) info.batteryBarcode = ascii(barcode) || hexBE(trimZeros(barcode))
  return info
}
