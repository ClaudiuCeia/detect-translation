import { LangTranslatorInfo } from ".";
import normalizeLangTag from "./normalizeLangTag";
import { UNDETERMINED_LANGUAGE } from "./constants";

export type LangIds = { [lang: string]: RegExp };

export type SourceDocumentMetadata = {
  lang: string;
  canary?: {
    selector?: string;
    isFirstContentfulChild?: boolean;
    text?: string;
    langIds?: LangIds;
  };
};

// TODO: detect QQ Browser’s side-by-side comparison (it leaves the original untouched, and adds Chinese)

const getDocumentLang = (
  source: SourceDocumentMetadata,
): LangTranslatorInfo => {
  const doc = document.documentElement;
  const canary: { el: HTMLElement | null | undefined; text?: string } = {
    el: (source?.canary?.selector &&
      document.querySelector(source.canary.selector)) as
      | HTMLElement
      | null
      | undefined,
  };
  if (doc.lang !== source.lang) {
    return {
      lang: normalizeLangTag(doc.lang),
    };
  }
  if (canary.el?.lang && canary.el.lang !== source.lang) {
    return {
      lang: normalizeLangTag(canary.el.lang),
    };
  }
  canary.text =
    canary.el?.innerText.trim() ||
    // for any agent that replaces invisible links with a (translated) text node - such as Gramtrans
    ((source.canary?.isFirstContentfulChild ?? true) &&
      document.body.firstChild instanceof Text &&
      document.body.firstChild.textContent?.trim()) ||
    "";
  if (canary.text === source.canary?.text) {
    return {
      lang: normalizeLangTag(source.lang),
    };
  }
  if (!canary.text) {
    // we can’t find the canary text and the document lang hasn’t been specified; fall back...

    // return 'und', i.e. undetermined
    return {
      lang: UNDETERMINED_LANGUAGE,
    };
  }
  // We know that the content is translated (canary.text !== source.canary.text) but don’t know the lang
  return {
    lang: identifyLangFromCanaryText(canary.text, source.canary?.langIds),
  };
};

const identifyLangFromCanaryText = (() => {
  let _text: string;
  let _langIds: LangIds;
  let _langIdsEntries: Array<[string, RegExp]>;
  let _result: string;

  return (text: string, langIds: LangIds | undefined): string => {
    if (!langIds) return UNDETERMINED_LANGUAGE;

    if (_text === text && _langIds === langIds && _result) {
      return _result;
    }

    // cache the result, so for a given string and langIds, we compute it only once
    if (_langIds !== langIds) {
      _langIds = langIds;
      _langIdsEntries = Object.entries(langIds);
    }
    _text = text;

    const [lang] = _langIdsEntries.find(([, re]) => re.test(text)) || [];

    _result = lang || UNDETERMINED_LANGUAGE;

    return _result;
  };
})();

export default getDocumentLang;
