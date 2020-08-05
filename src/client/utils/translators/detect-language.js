/* global MutationObserver */
import LangMetaString from './lang-meta-string';
import isPageTranslated from './is-page-translated';
import detectTranslator from './detect-translator';
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
const getBaseTargetLang = (translator) => {
  const {
    documentLang,
    elementLang,
  } = isPageTranslated();

  let targetLang = 'und';

  if (documentLang !== SOURCE_LANGUAGE) {
    targetLang = documentLang;
  } else if (elementLang && elementLang !== SOURCE_LANGUAGE) {
    targetLang = elementLang;
  } else {
    // heuristics, sigh
    switch (translator) {
      case 'apertium': {
        // https://www.apertium.org/index.eng.html?dir=arg-cat&qP=https…Fwww.sciencedirect.com%2Ftopics%2Fneuroscience%2Fcoronavirus
        const APERTIUM_LANGS = {
          cat: 'ca',
          cat_valencia: 'ca-u-sd-esvc',
          eng: 'en',
          epo: 'eo',
          glg: 'gl',
          spa: 'es',
        };
        const [src, target] = getQueryParam('dir').split('-');
        if (
          APERTIUM_LANGS[src] === SOURCE_LANGUAGE // must be set to eng-xxx to work
          && APERTIUM_LANGS[target]
        ) {
          targetLang = APERTIUM_LANGS[target];
        }
        break;
      }
      case 'baidu':
      case 'sogou-web': {
        targetLang = getQueryParam('to');
        break;
      }
      case 'gramtrans': {
        const GRAMTRANS_LANGS = {
          dan: 'da',
          deu: 'de',
          eng: 'en',
          'eng/us': 'en-US',
          'eng/uk': 'en-GB',
          epo: 'eo',
          nor: 'no',
          swe: 'sw',
          qax: 'eo',
        };
        const [src, target] = GRAMTRANS_LANGS[getQueryParam('pair').split('2')[1]];
        if (src && target && src.startsWith('en')) {
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
      case '': {
        targetLang = getIbmWatsonTargetLang();
        break;
      }
      default:
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
  const translator = detectTranslator();

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
  let observer;
  if ('MutationObserver' in window) {
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
        } finally {
          observer.disconnect();
          observer = null;
        }
      }).catch(() => { })
        .then(sleep(100)) // to give the translator time to do other DOM updates
        .then()
    ]);
  }
};

export default getFullyQualifiedPageLang;
