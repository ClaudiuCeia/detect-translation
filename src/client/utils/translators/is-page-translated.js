import './create-lang-id-strings';

import LangMetaString from './lang-meta-string';
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

  const translated = (
    docLang !== SOURCE_LANGUAGE
    || (contentLang && contentLang !== SOURCE_LANGUAGE)
    || innerText !== SKIP_TO_MAIN_CONTENT_TEXT
  );

  if (translated) {
    return new LangMetaString(
      docLang !== SOURCE_LANGUAGE
        ? docLang
        : contentLang
        || 'und',
      {
        docLang,
        contentLang,
        text: innerText,
      },
    );
  }

  return false;
};

export default isPageTranslated;
