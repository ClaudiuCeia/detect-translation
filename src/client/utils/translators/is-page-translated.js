import './create-lang-id-strings';

import LangMetaString from './lang-meta-string';
import { CAIYUN_TRANSLATION_CLASSNAME } from './detect-translator';
import { QQ_BROWSER_SIDE_BY_SIDE_CLASSNAME } from './detect-language';
import {
  SOURCE_LANGUAGE,
  SKIP_TO_MAIN_CONTENT_ID,
  SKIP_TO_MAIN_CONTENT_TEXT,
} from '../../../common/constants';

/* URLs for reference:
 *
 * Google Translate: https://translate.google.com/ (also works as built-in browser extennsion)
 * Bing Microsoft Translator: https://www.bing.com/translator
 * Yandex.Translate: https://translate.yandex.com/
 * Baidu Translate: https://fanyi.baidu.com/
 * IBM Watson Language Translator: https://www.ibm.com/watson/services/language-translator/#demo
 */


/**
* Indicates whether the document has been translated and returns the document’s
* documentElement, the indicator element’s lang, and the innerText
*
* @returns {LangMetaString | boolean}
*/
const isPageTranslated = () => {
  const { lang: docLang } = document.documentElement;
  const { lang: contentLang, innerText } = document.getElementById(SKIP_TO_MAIN_CONTENT_ID);

  // Special case: QQ Browser’s side-by-side comparison leaves the original, and adds Chinese
  const qqSideBySideTranslation = document.querySelector(`.${QQ_BROWSER_SIDE_BY_SIDE_CLASSNAME}`);

  const translated = (
    (docLang && docLang !== SOURCE_LANGUAGE)
    || (contentLang && contentLang !== SOURCE_LANGUAGE)
    || innerText !== SKIP_TO_MAIN_CONTENT_TEXT
    || qqSideBySideTranslation
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
        // shortcut as QQ’s side-by-side translation doesn’t include our Skip to main content link
        docLang: qqSideBySideTranslation ? 'zh' : docLang,
        contentLang,
        text: caiyunEl ? caiyunEl.innerText : innerText,
      },
    );
  }

  return false;
};

export default isPageTranslated;
