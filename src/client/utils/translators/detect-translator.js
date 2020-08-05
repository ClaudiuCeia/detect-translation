import LangMetaString from './lang-meta-string';
import getIbmWatsonTargetLang from './ibm-watson';

const HOSTNAME_TRANSLATOR_MAP = {
  'www.apertium.org': 'apertium',
  'www.translatoruser-int.com': 'bing',
  'translate.baiducontent.com': 'baidu',
  'translate.googleusercontent.com': 'google-web',
  'gramtrans.com': 'gramtran',
  'papago.naver.net': 'papago',
  'translate.sogoucdn.com': 'sogou-web',
  'z5h64q92x9.net': 'yandex-web',
};

/**
 * Returns a best guess at the translator which has translated the page.
 * Assumes that the page has indeed been translated.
 *
 * @returns {string | LangMetaString} - BCP47 token (two to eight characters)
 */
const detectTranslator = () => {
  const { hostname } = window.location;

  if (HOSTNAME_TRANSLATOR_MAP[hostname]) {
    return HOSTNAME_TRANSLATOR_MAP[hostname];
  }
  if (
    document.querySelector('[href^="https://translate.googleapis.com"]')
    || document.querySelector('#goog-gt-tt')
    || document.querySelector('.goog-te-spinner-pos')
  ) {
    return 'google-browser';
  }
  if (
    document.querySelector('[_msthash]')
    || document.querySelector('[_msttexthash]')
  ) {
    return 'msedge-browser'; // Microsoft Translate extension (legacy Edge and modern Edge)
  }
  if (
    document.querySelector('[class^="sg-trans"]')
  ) {
    return 'sogou-browser';
  }
  if (
    document.querySelector('#tr-popup[translate][data-hidden][data-translation]')
    && window.navigator.userAgent.includes('YaBrowser')
  ) {
    return 'yandex-browser';
  }
  // Could be IBM Watson, could be translated saved webpage; let’s check
  const ibmWatsonLang = getIbmWatsonTargetLang();
  if (
    hostname === ''
    && `${ibmWatsonLang}` !== 'und'
  ) {
    return 'ibmwatsn';
  }

  // We failed! :( Return 'und` (undetermined) along with a clue
  // If `getIbmWatsonTargetLang` returned a LangMetaString, this extends its meta object
  return new LangMetaString(ibmWatsonLang, { host: hostname });
};

export default detectTranslator;
