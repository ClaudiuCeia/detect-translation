// These regular expressions start with ^ as language subtags must appear at the start of a
// compliant language tag, and most end with \b (word boundary) as this will match any tag
// that either ends with the string, or continues with other subtags.

// For example, /^tl\b/ will match both 'tl' (Tagalog) and also 'tl-PH' (Tagalog as spoken
// in the Philippines), but not 'tly' or 'tly-AZ' (Talysh language as spoken in Azerbaijan).

const NORMALISE_LANG_MAPPING = {
  bs: /^bs-Latn\b/, // Bosnian (Sogou)
  "ca-valencia": /^cat_valencia\b/, // Catalan (Valencia) (Apertium)
  "en-US": /^eng\/us$/, // English (US) (Gramtrans)
  "en-GB": /^eng\/uk$/, // English (UK) (Gramtrans)
  he: /^iw\b/, // Hebrew (Google)
  // note: if a service IDs something as ku (Kurdish - but Northern Kurdish in Latin script
  // by default as per CLDR Likely Subtags), we need to check against the lang IDs as it
  // might actually be ckb (Central Kurdish, written in Arabic script)
  ku: /^kmr\b/, // Kurdish (Northern) (Bing) - the default for macrolanguage subtag ku
  hmn: /^mww\b/, // Hmong Daw; hmn is the inclusive code for Hmong (Bing/Sogou)
  fil: /^tl\b/, // Filipino (fil is more correct for the official language of the Philippines)
  "kk-Latn": /^kazlat\b/, // Kazakh (Latin) (Yandex)
  sr: /^sr-Cyrl\b/, // Serbian (Cyrillic is the default in Serbia)
  "uz-Cyrl": /^usbcyr\b/, // Uzbek (Cyrillic) (Yandex)
};

/**
 * Normalises language codes, modernising old ones etc
 *
 * @param {string} lang - input language code
 * @returns {string} normalised language code
 */
const normaliseLangCode = (lang: string): string => {
  const [normalisedTag, nonstd] =
    Object.entries(NORMALISE_LANG_MAPPING).find(([, nonstd]) =>
      nonstd.test(lang)
    ) || [];

  return normalisedTag ? lang.replace(nonstd as RegExp, normalisedTag) : lang;
};

export default normaliseLangCode;
