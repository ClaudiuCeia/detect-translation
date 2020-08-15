const NORMALISE_LANG_MAPPING = {
  ara: 'ar', // Arabic (Baidu)
  bul: 'bg', // Bulgarian (Baidu)
  'bs-Latn': 'bs', // Bosnian (Sogou)
  cat: 'ca', // Catalan (Apertium)
  cat_valencia: 'ca-valencia', // Catalan (Valencia) (Apertium)
  cht: 'zh-Hant', // Traditional Chinese (Baidu)
  eng: 'en', // English (Apertium, Gramtrans)
  est: 'et', // Estonian (Baidu)
  epo: 'eo', // Esperanto (Apertium, Gramtrans)
  fin: 'fi', // Finnish (Baidu)
  fra: 'fr', // French (Baidu)
  glg: 'gl', // Galician (Apertium)
  dan: 'da', // Danish (Baidu, Gramtrans)
  deu: 'de', // German (Gramtrans)
  'eng/us': 'en-US', // English (US) (Gramtrans)
  'eng/uk': 'en-GB', // English (UK) (Gramtrans)
  kor: 'ko', // Korean (Baidu)
  nor: 'no', // Norwegian (Gramtrans)
  rom: 'ro', // Romanian (Baidu)
  slo: 'sk', // Slovakian - NOTE `slo` is for SLOVAKIAN (sk) but Baidu means SLOVENIAN (sl), so we have custom code for Baidu in detect-language.js just for this case
  swe: 'sv', // Swedish (Baidu, Gramtrans)
  spa: 'es', // Spanish (Apertium, Baidu)
  qax: 'eo', // Esperanto (VISL) (Gramtrans)
  'bs-Latn': 'bs', // Bosnian (Sogou)
  'zh-CHS': 'zh', // Simplified Chinese (Sogou, Youdao) (Hans does not need to be specified)
  'zh-CHT': 'zh-Hant', // Traditional Chinese (Sogou) (Hant should be specified)
  'zh-CN': 'zh',
  'zh-TW': 'zh-Hant',
  iw: 'he', // Hebrew (Google)
  mww: 'hmn', // Hmong Daw; hmn is the inclusive code for Hmong (Bing/Sogou)
  tl: 'fil', // Filipino (fil is more correct for the official language of the Philippines)
  kazlat: 'kk-Latn', // Kazakh (Latin) (Yandex)
  'sr-Cyrl': 'sr', // Serbian (Cyrillic is the default in Serbia)
  usbcyr: 'uz-Cyrl', // Uzbek (Cyrillic) (Yandex)
  vie: 'vi', // Vietnamese (Baidu)
  wyw: 'lzh', // Classical/Literary Chinese (Baidu, from 文言文, Wényánwén)
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
