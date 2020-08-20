import LangMetaString from './lang-meta-string';

const HOSTNAME_TRANSLATOR_MAP = {
  'www.apertium.org': 'apertium',
  'www.translatoruser-int.com': 'msft',
  'translate.baiducontent.com': 'baidu',
  'interpreter.caiyunai.com': 'caiyun',
  'translate.googleusercontent.com': 'google-web',
  'gramtrans.com': 'gramtran',
  'papago.naver.net': 'papago',
  'translate.sogoucdn.com': 'sogou-web',
  'z5h64q92x9.net': 'yandex-web',
  'webtrans.yodao.com': 'youdao',
  'www.worldlingo.com': 'worldlingo',
};

// Used by is-page-translated, but exported from here as it’s a translator-specific quirk
export const CAIYUN_TRANSLATION_CLASSNAME = 'cyxy-trs-target';

/**
 * Returns a best guess at the translator which has translated the page.
 * Assumes that the page has indeed been translated.
 *
 * @returns {string | LangMetaString} - BCP47 token (two to eight characters)
 */
const detectTranslator = () => {
  const { hostname, pathname } = window.location;

  if (HOSTNAME_TRANSLATOR_MAP[hostname]) {
    return HOSTNAME_TRANSLATOR_MAP[hostname];
  }
  if (
    document.querySelector('[href^="https://translate.googleapis.com"]')
    || document.querySelector('#goog-gt-tt')
    || document.querySelector('.goog-te-spinner-pos')
  ) {
    // This is Google Translate inside a browser
    // We can’t be sure which browser — could be Google Chrome, could be 360 Secure Browser
    return 'google-browser';
  }
  if (
    document.querySelector('[_msthash]')
    || document.querySelector('[_msttexthash]')
  ) {
    return 'msft-browser'; // Microsoft Translate extension (legacy Edge and modern Edge)
  }
  if (
    document.querySelector('#qbTrans-pageTrans-dialog')
    || document.querySelector('[class^=qbTrans-pageTrans-dialog]')
  ) {
    return 'qq-browser';
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
  const filename = decodeURIComponent(pathname.split(/\\|\//).reverse()[0]);
  // This regex is to be tested against the last pathname segment (“the filename”)
  const IBM_WATSON_PATHNAME_LANGUAGE_REGEXP = /([A-Za-z ()]+)\.html$/;
  if (
    hostname === ''
    && filename.startsWith('https __www.sciencedirect.com_topics_')
    && filename.endsWith('.html')
    && filename.match(IBM_WATSON_PATHNAME_LANGUAGE_REGEXP)) {
    // we only detect IBM Watson using the saved filename
    return 'ibmwatsn';
  }

  // We failed! :( Return 'und` (undetermined) along with a clue
  // If `getIbmWatsonTargetLang` returned a LangMetaString, this extends its meta object
  return new LangMetaString('und', { host: hostname });
};

export default detectTranslator;
