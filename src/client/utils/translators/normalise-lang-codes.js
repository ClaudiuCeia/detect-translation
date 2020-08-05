const NORMALISE_LANG_MAPPING = {
  'zh-CHS': 'zh-CN',
  'zh-CHT': 'zh-TW',
  iw: 'he', // Hebrew
  tl: 'fil', // Filipino
  kazlat: 'kk-Latn', // Kazakh (Latin) (Yandex)
  'sr-Cyrl': 'sr', // Serbian (Cyrillic is the default in Serbia)
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
