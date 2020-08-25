import LangMetaString from './lang-meta-string';
import isPageTranslated from './is-page-translated';
import detectTranslator from './detect-translator';
import langIdStrings from './lang-id-strings';
import { SOURCE_LANGUAGE } from '../../../common/constants';
import normaliseLangCode from './normalise-lang-codes';

// Special case: QQ Browser’s side-by-side comparison leaves the original, and adds Chinese
export const QQ_BROWSER_SIDE_BY_SIDE_CLASSNAME = 'qbTrans-common-compair-dialog';

/**
 * Returns a named param from the string of query params in window.location.query.
 *
 * @param {string} name - the query parameter to find
 * @returns {string} value of the query param
 */
const getQueryParam = (name) => {
  const params = window.location.search.slice(1).split('&').map(p => p.split('='));
  const match = (params.find(([param]) => param === name) || [])[1];
  return match || '';
};

/**
 * Returns the standardised BCP47 base target language code:
 *  - usually two letters (zh, ru, fr, en)
 *  - sometimes three letters (yue, fil)
 *  - sometimes with qualifying script or region codes (zh-Hans, en-GB)
 *  - without any -t- or -x- extension
 *
 * @param {string} translator - the detected machine translation engine
 * @returns {string} the basic BCP47 code for the page’s target language
 */
export const getBaseTargetLang = ({ translator = 'und' } = {}) => {
  const {
    documentLang,
    elementLang,
    text,
  } = isPageTranslated().meta;

  let targetLang = 'und';

  if (documentLang && (documentLang !== SOURCE_LANGUAGE)) {
    targetLang = documentLang;
  } else if (elementLang && (elementLang !== SOURCE_LANGUAGE)) {
    targetLang = elementLang;
  } else {
    // heuristics, sigh
    switch (translator) {
      case 'apertium': {
        // https://www.apertium.org/index.eng.html?dir=arg-cat&qP=https…Fwww.sciencedirect.com%2Ftopics%2Fneuroscience%2Fcoronavirus
        const [src, target] = getQueryParam('dir').split('-');
        if (
          src && target
          && normaliseLangCode(src) === SOURCE_LANGUAGE // must be set to eng-xxx to work
        ) {
          targetLang = target; // will be normalised below
        }
        break;
      }
      case 'baidu':
      case 'sogou-web':
      case 'youdao': {
        const [src, target] = ['from', 'to'].map(getQueryParam);
        if (
          src && target
          && (src === 'auto' || normaliseLangCode(src) === SOURCE_LANGUAGE)
        ) {
          targetLang = target;
        }
        if (
          translator === 'baidu'
          && targetLang === 'slo'
        ) {
          // special case: in Baidu, slo means Slovenian (sl)
          // but the standard meaning is Slovakian (sk)
          // so we just set it to Slovenian here to avoid confusion.
          targetLang = 'sl';
        }
        break;
      }
      case 'gramtrans': {
        const [src, target] = getQueryParam('pair').split('2');
        if (
          src && target
          && normaliseLangCode(src) === SOURCE_LANGUAGE
        ) {
          targetLang = target;
        }
        break;
      }
      case 'papago': {
        const papagoTarget = getQueryParam('target');
        if (papagoTarget && papagoTarget !== 'auto') {
          targetLang = papagoTarget;
        }
        if (papagoTarget === 'auto') {
          targetLang = 'ko'; // Korean is their default
        }
        break;
      }
      case 'worldlingo': {
        // these params are in UPPERCASE so need to be lowercased before comparison
        const [src, target] = ['wl_srclang', 'wl_trglang']
          .map(getQueryParam)
          .map(lang => (lang ? lang.toLowerCase() : lang));
        if (
          src && target
          && normaliseLangCode(src) === SOURCE_LANGUAGE
        ) {
          targetLang = target;
        }
      }
      default:
    }
  }

  // Still we haven’t been able to detect the language; use our substring-to-language map
  // (for Sogou browser, MS Edge legacy and Chromium, and any others inc. IBM Watson)
  if (`${targetLang}` === 'und') {
    const [firstResult] = langIdStrings.split(',')
      .map(s => s.split(':'))
      .map(([substrs, l]) => substrs.split('|').map(s => [s, l]))
      .reduce((acc, val) => acc.concat(val), []) // .flat() is not supported by IE11 or Node 10
      .filter(([substr]) => text.includes(substr));
    if (firstResult) {
      const [, matchedLang] = firstResult;
      targetLang = matchedLang;
      if (matchedLang === 'sh') { // Serbo-Croatian; this is a macrolanguage, so default
        // to the user’s preferred country language (Bosnian, Croatian or Serbian)
        const { language, languages } = window.navigator;
        targetLang = (languages || [language])
          .find(l => l.split(/[-_]/)[0].match(/^(bs|hr|sr)$/))
          || matchedLang;
        // just in case the user’s preferred language includes Serbian
        // - Serbian defaults to Cyrillic if a script is not specified,
        // but we know (because it matched 'sh') that the translation is in Latin script
        if (targetLang.startsWith('sr') && !targetLang.startsWith('sr-Latn')) {
          targetLang = 'sr-Latn';
        }
      }
    }
  }

  return normaliseLangCode(targetLang);
};

/**
 * Returns the document’s standard language tag (and if the language or translator
 * cannot be detected, a page element’s innerText and current hostname)
 *
 * @returns {LangMetaString}
 */
export const getFullyQualifiedPageLang = () => {
  const {
    translated,
    documentLang,
    elementLang,
    innerText,
  } = isPageTranslated();

  if (!translated) {
    return documentLang;
  }

  const metadata = {};

  // We know that the doc has been translated. Now, let’s find out who translated it.
  let translator = detectTranslator();

  const { hostname } = window.location;
  if (
    translator === 'und'
    && !hostname.includes('sciencedirect')
  ) {
    const host = hostname
      .split('.')
      .filter(portion => portion.length > 3) // filter out www, com, net, org, co, jp, etc
      .join('.')
      .slice(0, 8);
    translator = host; // BCP-47 extension strings can only be 8 characters max
    metadata.host = hostname;
  }

  const targetLang = getBaseTargetLang();

  const stdLangTag = `${targetLang}-t-${SOURCE_LANGUAGE}-t0-${translator}`;

  if (!elementLang && (documentLang === SOURCE_LANGUAGE)) {
    // if the translator is setting the element’s lang attribute, that’s enough
    // otherwise, we set the document lang as a best-effort hint to screenreaders
    document.documentElement.lang = stdLangTag;
  }

  if (
    `${targetLang}` === 'und'
  ) {
    metadata.text = innerText;
  }

  return new LangMetaString(stdLangTag, metadata);
};

export default getFullyQualifiedPageLang;
