import type { Dict, Lang } from './index'
import { en } from './en'
import { es } from './es'
import { pt } from './pt'
import { fr } from './fr'
import { de } from './de'
import { ru } from './ru'
import { ja } from './ja'
import { zh } from './zh'
import { ko } from './ko'

export const DICTS: Record<Lang, Dict> = { en, es, pt, fr, de, ru, ja, zh, ko }
