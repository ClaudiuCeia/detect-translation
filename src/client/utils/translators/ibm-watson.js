import LangMetaString from './lang-meta-string';

// This regex is to be tested against the last pathname segment (“the filename”)
const IBM_WATSON_PATHNAME_LANGUAGE_REGEXP = /([A-Za-z ()]+)\.html$/;

/**
 * Returns IBM Watson target language name (in English)
 *
 * @returns {string | LangMetaString} - target language name (in English)
 */
const getIbmWatsonTargetLang = () => {
  // IBM Watson translated files have names of the form
  // file:///<local filesystem path>/https%20__www.sciencedirect.com_topics_physics-and-astronomy_magnetostriction_Chinese%20(Simplified).html

  const { pathname } = window.location;
  const filename = decodeURIComponent(pathname.split(/\\|\//).reverse()[0]);

  if (
    !filename.startsWith('https __www.sciencedirect.com_topics_')
    || !filename.endsWith('.html')
    || !filename.match(IBM_WATSON_PATHNAME_LANGUAGE_REGEXP)) {
    // we only detect IBM Watson using the saved filename
    return 'und';
  }

  const filenameLang = filename.match(IBM_WATSON_PATHNAME_LANGUAGE_REGEXP)[1]
    .toLowerCase();

  // Using the form `${initial letters of language name in English}[:${standard code}]`
  // Often (48%) the initial letters are the same as the code, so we can omit the code.
  const ENGLISH_ABBR_TO_ISO_CODE_MAPPING = 'ar,' // Arabic
    + 'be:bn,' // Bengali
    + 'bu:bg,' // Bulgarian
    + 'ca,' // Catalan
    + 'chinese (s:zh-Hans,' // Chinese (Simplified)
    + 'chinese (t:zh-Hant,' // Chinese (Traditional)
    + 'cr:hr,' // Croatian
    + 'cz:cs,' // Czech
    + 'da,' // Danish
    + 'du:nl,' // Dutch
    + 'en,' // English
    + 'es:et,' // Estonian
    + 'fi,' // Finnish
    + 'fr,' // French
    + 'ge:de,' // German
    + 'gr:el,' // Greek
    + 'gu,' // Gujurati
    + 'he,' // Hebrew
    + 'hi,' // Hindi
    + 'hu,' // Hungarian
    + 'ir:ga,' // Irish
    + 'it,' // Italian
    + 'ja,' // Japanese
    + 'ko,' // Korean
    + 'la:lv,' // Latvian
    + 'li:lt,' // Lithuanian
    + 'malay:ms,' // Malay
    + 'malayalam:ml,' // Malayalam
    + 'malt:mt,' // Maltese
    + 'ne,' // Nepalese
    + 'no:nb,' // Norwegian Bokmal
    + 'pol:pl,' // Polish
    + 'por:pt,' // Portuguese
    + 'ro,' // Romanian
    + 'ru,' // Russian
    + 'si,' // Sinhala
    + 'slova:sk,' // Slovak
    + 'slove:sl,' // Slovenian
    + 'sp:es,' // Spanish
    + 'sw:sv,' // Swedish
    + 'ta,' // Tamil
    + 'te,' // Telugu
    + 'th,' // Thai
    + 'tu:tr,' // Turkish
    + 'uk,' // Ukrainian
    + 'ur,' // Urdu
    + 'vi,' // Vietnamese
    + 'we:cy'; // Welsh

  const shortlistLangs = ENGLISH_ABBR_TO_ISO_CODE_MAPPING
    .split(',')
    .reduce((result, lang) => {
      const [abbr, std] = lang.split(':');
      if (filenameLang.startsWith(abbr)) {
        // construct an object with property:value for each pair,
        // so we can do the next step

        // For many of the langs, the abbreviation is the same as the standard
        // language code (e.g. ar == Arabic, fr == French), so fall back to the abbr
        result[abbr] = std || abbr;
      }
      return result;
    }, {});

  // Look for an exact match (malayalam vs malay)
  if (shortlistLangs[filenameLang]) {
    return shortlistLangs[filenameLang];
  }

  // Otherwise, find the first entry that starts with the abbreviation
  const [, match] = Object.entries(shortlistLangs)
    .find(([abbr]) => filenameLang.startsWith(abbr));
  if (match) {
    return match;
  }

  // Bailing out; return `und` (undetermined), along with a clue
  return new LangMetaString('und', { clue: filenameLang });
};

export default getIbmWatsonTargetLang;
