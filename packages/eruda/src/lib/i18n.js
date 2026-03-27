import Emitter from 'licia/Emitter'
import langs from './lang'

let currentLang = 'en'

const emitter = new Emitter()

const i18n = {
  /**
   * Get current language
   */
  getLang() {
    return currentLang
  },

  /**
   * Set current language
   */
  setLang(lang) {
    if (langs[lang]) {
      currentLang = lang
      emitter.emit('langChange', lang)
    }
  },

  /**
   * Get available languages
   */
  getLangs() {
    return Object.keys(langs)
  },

  /**
   * Get translation by key path
   * @param {string} key - Dot separated key path, e.g. 'tools.console'
   * @param {object} data - Optional data for interpolation
   */
  t(key, data = {}) {
    const keys = key.split('.')
    let value = langs[currentLang]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if key not found in current language
        value = langs['en']
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Simple interpolation: replace {{key}} with data[key]
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  },

  /**
   * Listen to language change event
   */
  onLangChange(callback) {
    emitter.on('langChange', callback)
    return () => emitter.off('langChange', callback)
  },

  /**
   * Get all translations for current language
   */
  getAll() {
    return langs[currentLang]
  },
}

export default i18n
