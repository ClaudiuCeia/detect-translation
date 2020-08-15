/* global MutationObserver */
import LangMetaString from './lang-meta-string';
import isPageTranslated from './is-page-translated';
import detectTranslator from './detect-translator';
import langIdStrings from './lang-id-strings';
import {
  SOURCE_LANGUAGE,
  SKIP_TO_MAIN_CONTENT_ID,
} from '../../../common/constants';
import normaliseLangCode from './normalise-lang-codes';
import getIbmWatsonTargetLang from './ibm-watson';

/**
 * Sleeps for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const sleep = ms => new Promise(resolve => (ms < Infinity) && setTimeout(resolve, ms));

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
  } else {/*
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
      case 'sogou-web': {
        targetLang = getQueryParam('to');
        // special case: in Baidu, slo means Slovenian (sl)
        // but the standard meaning is Slovakian (sk)
        // so we just set it to Slovenian here to avoid confusion.
        if (targetLang === 'slo') targetLang = 'sl';
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
      case 'youdao': {
        const [src, target] = ['from', 'to'].map(p => getQueryParam(p));
        if (
          src && target
          && (src === 'auto' || normaliseLangCode(src) === SOURCE_LANGUAGE)
        ) {
          targetLang = target;
        }
      }
      case '': {
        targetLang = getIbmWatsonTargetLang();
        break;
      }
      default:
    } */
  }

  // Still we haven’t been able to detect the language; use our substring-to-language map
  // (for Sogou browser, MS Edge legacy and Chromium, and any others inc. IBM Watson)
  if (`${targetLang}` === 'und') {
    const matches = langIdStrings.split(',')
      .map(s => s.split(':'))
      // .filter(([substrs, l]) => l !== 'or')
      .map(([substrs, l]) => substrs.split('|').map(s => [s, l]))
      .reduce((acc, val) => acc.concat(val), []) // .flat() is not supported by IE11 or Node 10
      .filter(([substr]) => text.includes(substr));
    if (matches && matches.length) {
      if (matches.length > 1) {
        console.log('Matched', matches);
      }
      (
        [[, targetLang]] = matches
      );
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

export const listenForLanguageChange = async ({ timeout = Infinity } = {}) => {
  if ('MutationObserver' in window) {
    let observer;
    try {
      await Promise.race([
        sleep(timeout),
        new Promise((resolve, reject) => {
          try {
            observer = new MutationObserver(resolve);
            observer.observe(
              document.documentElement,
              { attributes: true },
            );
            observer.observe(
              document.getElementById(SKIP_TO_MAIN_CONTENT_ID),
              { attributes: true, childList: true, characterData: true },
            );
          } catch (err) {
            reject(err);
          }
        }),
      ]);
      await sleep(5); // to give the translator time to do other DOM updates
    } finally {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  }
};

export default getFullyQualifiedPageLang;
