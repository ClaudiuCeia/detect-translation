/* global MutationObserver */
import LangMetaString from './lang-meta-string';
import { CAIYUN_TRANSLATION_CLASSNAME } from './detect-translator';
import detectLanguage, { QQ_BROWSER_SIDE_BY_SIDE_CLASSNAME } from './detect-language';
import {
  SOURCE_LANGUAGE,
  SKIP_TO_MAIN_CONTENT_ID,
  SKIP_TO_MAIN_CONTENT_TEXT,
} from '../../../common/constants';

/* URLs for reference:
 *
 * Apertium: https://apertium.org/
 * Baidu Translate: https://fanyi.baidu.com/
 * Bing Microsoft Translator: https://www.bing.com/translator (also browser extension in Edge)
 * Caiyun: https://fanyi.caiyunapp.com/
 * Google Translate: https://translate.google.com/ (also browser extension in Chrome and 360 Secure Browser)
 * Gramtrans: https://gramtrans.com/
 * IBM Watson Language Translator: https://www.ibm.com/watson/services/language-translator/#demo
 * Papago: https://papago.naver.com/
 * Sogou: https://fanyi.sogou.com/
 * Yandex.Translate: https://translate.yandex.com/ (also browser extension in Yandex Browser)
 * Youdao: http://fanyi.youdao.com/
 */

/**
* Indicates whether the document has been translated and returns the document’s
* documentElement, the indicator element’s lang, and the innerText
*
* @returns {LangMetaString | boolean}
*/
const isPageTranslated = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  const { lang: docLang } = document.documentElement;
  const { lang: contentLang, innerText } = document.getElementById(SKIP_TO_MAIN_CONTENT_ID);

  // Special case: QQ Browser’s side-by-side comparison leaves the original, and adds Chinese
  const qqSideBySideTranslation = document.querySelector(`.${QQ_BROWSER_SIDE_BY_SIDE_CLASSNAME}`);

  const translated = Boolean(
    (docLang && docLang !== SOURCE_LANGUAGE)
    || (contentLang && contentLang !== SOURCE_LANGUAGE)
    || innerText !== SKIP_TO_MAIN_CONTENT_TEXT
    || qqSideBySideTranslation,
  );

  if (translated) {
    // Special case: Caiyun inserts its translations alongside the original
    const caiyunEl = document.querySelector(`#${SKIP_TO_MAIN_CONTENT_ID} > .${CAIYUN_TRANSLATION_CLASSNAME}`);

    return new LangMetaString(
      docLang !== SOURCE_LANGUAGE
        ? docLang
        : contentLang
        || 'und',
      {
        // Assume Chinese, as QQ’s side-by-side translation
        // doesn’t include our Skip to main content link
        docLang: qqSideBySideTranslation ? 'zh' : docLang,
        contentLang,
        text: caiyunEl ? caiyunEl.innerText : innerText,
      },
    );
  }

  return false;
};

/**
 * Sleeps for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const sleep = ms => new Promise(resolve => (ms < Infinity) && setTimeout(resolve, ms));

export const listenForLanguageChange = async ({ timeout = Infinity } = {}) => {
  if ('MutationObserver' in window) {
    let observer;
    try {
      await Promise.race([
        sleep(timeout),
        new Promise((resolve, reject) => {
          try {
            observer = new MutationObserver((records) => {
              if (!records.find(
                r => r.type !== 'attributes' || r.attributeName === 'lang',
              )) {
                return;
              }
              resolve();
            });
            observer.observe(
              document.documentElement,
              { attributes: true },
            );
            observer.observe(
              document.getElementById(SKIP_TO_MAIN_CONTENT_ID),
              { attributes: true, childList: true, characterData: true },
            );
          } catch (err) {
            console.error('MutationObserver error:', err);
            reject(err);
          }
        }),
      ]);
      await sleep(10); // to give the translator time to do other DOM updates
      const result = detectLanguage();
      return result;
    } finally {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  }
  return 'und';
};

export default isPageTranslated;
