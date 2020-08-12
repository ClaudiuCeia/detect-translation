const NORMALISE_LANG_MAPPING = {
  cat: 'ca', // Catalan (Apertium)
  cat_valencia: 'ca-valencia', // Catalan (Valencia) (Apertium)
  eng: 'en', // English (Apertium, Gramtrans)
  epo: 'eo', // Esperanto (Apertium, Gramtrans)
  glg: 'gl', // Galician (Apertium)
  spa: 'es', // Spanish (Apertium)
  dan: 'da', // Danish (Gramtrans)
  deu: 'de', // German (Gramtrans)
  'eng/us': 'en-US', // English (US) (Gramtrans)
  'eng/uk': 'en-GB', // English (UK) (Gramtrans)
  nor: 'no', // Norwegian (Gramtrans)
  swe: 'sv', // Swedish (Gramtrans)
  qax: 'eo', // Esperanto (VISL) (Gramtrans)
  'bs-Latn': 'bs', // Bosnian (Sogou)
  'zh-CHS': 'zh-CN',
  'zh-CHT': 'zh-TW',
  iw: 'he', // Hebrew (Google)
  mww: 'hmn', // Hmong Daw; hmn is the inclusive code for Hmong (Bing/Sogou)
  tl: 'fil', // Filipino (fil is more correct for the official language of the Philippines)
  kazlat: 'kk-Latn', // Kazakh (Latin) (Yandex)
  'sr-Cyrl': 'sr', // Serbian (Cyrillic is the default in Serbia)
  usbcyr: 'uz-Cyrl', // Uzbek (Cyrillic) (Yandex)
};

/**
 * Normalises language codes, modernising old ones etc
 * 
 * @param {string} lang - input language code
 * @returns {string} normalised language code
 */
const normaliseLangCode = (lang) => {
  const [, normalisedTag] = Object.entries(NORMALISE_LANG_MAPPING).find(
    ([nonstd]) => lang.startsWith(nonstd),
  ) || [];

  return normalisedTag || lang;
};

export default normaliseLangCode;
